import * as pulumi from "@pulumi/pulumi";

import { type components, Configured, unwrap } from "../client.ts";

type Values = Record<string, unknown>;

// Listmonk returns secrets masked as "•••", and keeps the stored secret only when sent an empty one.
const masked = (value: unknown) => typeof value === "string" && /^•+$/u.test(value);

function unmask(value: unknown): unknown {
  if (masked(value)) return "";
  if (Array.isArray(value)) return value.map(unmask);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, unmask(value)]));
  return value;
}

// A masked secret can't be compared, so it reads back as the value last applied.
function restore(live: unknown, applied: unknown): unknown {
  if (masked(live)) return applied;
  if (Array.isArray(live))
    return live.map((value, index) =>
      restore(value, Array.isArray(applied) ? applied[index] : undefined),
    );
  if (live && typeof live === "object")
    return Object.fromEntries(
      Object.entries(live).map(([key, value]) => [
        key,
        restore(value, (applied as Values | undefined)?.[key]),
      ]),
    );
  return live;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable((value as Values)[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

// pulumi.dynamic.Resource keeps its serialized implementation among the inputs, as `__provider`.
const settingsOf = (inputs: Values): Values =>
  Object.fromEntries(Object.entries(inputs).filter(([key]) => key !== "__provider"));

// The spec's Settings schema predates keys Listmonk has had since v3 (`bounce.actions`,
// `privacy.record_optin_ip`), so settings go by the running instance's keys instead.
class SettingsProvider
  extends Configured
  implements pulumi.dynamic.ResourceProvider<Values, Values>
{
  private async current() {
    const listmonk = await this.connect();
    return unwrap(await listmonk.GET("/settings")) as Values;
  }

  private async apply(inputs: Values) {
    const values = settingsOf(inputs);
    const listmonk = await this.connect();
    await this.ready(listmonk);

    // A PUT replaces every setting, so start from the current ones.
    const settings = unmask(await this.current()) as Values;

    const unknown = Object.keys(values).filter((key) => !(key in settings));
    if (unknown.length > 0)
      throw new Error(`Listmonk has no settings named ${unknown.join(", ")}.`);

    unwrap(
      await listmonk.PUT("/settings", {
        body: { ...settings, ...values } as components["schemas"]["Settings"],
      }),
    );

    // Saving settings restarts Listmonk in place.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await this.ready(listmonk);
  }

  async diff(_id: string, olds: Values, news: Values) {
    return { changes: stable(settingsOf(olds)) !== stable(settingsOf(news)) };
  }

  async create(inputs: Values) {
    await this.apply(inputs);
    return { id: this.connection.endpoint, outs: inputs };
  }

  async update(_id: string, _olds: Values, news: Values) {
    await this.apply(news);
    return { outs: news };
  }

  async read(id: string, props?: Values) {
    if (!props)
      throw new Error(`Listmonk settings "${id}" can't be imported; secrets are unreadable.`);

    const live = await this.current();

    const settings = Object.keys(settingsOf(props)).map((key) => [
      key,
      restore(live[key], props[key]),
    ]);

    return { id, props: { ...props, ...Object.fromEntries(settings) } };
  }

  // Listmonk always has settings; leaving them is all a delete can do.
  async delete() {}
}

// Keyed as GET /api/settings keys them (`app.root_url`, `smtp`, …). Unlisted settings are kept.
export type SettingsArgs = Record<string, pulumi.Input<unknown>>;

export class Settings extends pulumi.dynamic.Resource {
  constructor(name: string, args: SettingsArgs, options?: pulumi.CustomResourceOptions) {
    super(new SettingsProvider(), name, args, options, "listmonk", "Settings");
  }
}

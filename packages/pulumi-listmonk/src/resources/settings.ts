import * as pulumi from "@pulumi/pulumi";

import {
  type components,
  type Connection,
  type ConnectionArgs,
  connect,
  ready,
  unwrap,
} from "../client.ts";

type Values = Record<string, unknown>;

interface SettingsInputs {
  connection: Connection;
  values: Values;
}

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

// The spec's Settings schema predates keys Listmonk has had since v3 (`bounce.actions`,
// `privacy.record_optin_ip`), so settings go by the running instance's keys instead.
async function current(connection: Connection) {
  const listmonk = await connect(connection);
  return unwrap(await listmonk.GET("/settings")) as Values;
}

async function apply({ connection, values }: SettingsInputs) {
  const listmonk = await connect(connection);
  await ready(listmonk, connection.endpoint);

  // A PUT replaces every setting, so start from the current ones.
  const settings = unmask(await current(connection)) as Values;

  const unknown = Object.keys(values).filter((key) => !(key in settings));
  if (unknown.length > 0) throw new Error(`Listmonk has no settings named ${unknown.join(", ")}.`);

  unwrap(
    await listmonk.PUT("/settings", {
      body: { ...settings, ...values } as components["schemas"]["Settings"],
    }),
  );

  // Saving settings restarts Listmonk in place.
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await ready(listmonk, connection.endpoint);
}

const provider: pulumi.dynamic.ResourceProvider<SettingsInputs, SettingsInputs> = {
  async diff(_id, olds, news) {
    const changes =
      stable(olds.connection) !== stable(news.connection) ||
      stable(olds.values) !== stable(news.values);

    return { changes };
  },

  async create(inputs) {
    await apply(inputs);
    return { id: inputs.connection.endpoint, outs: inputs };
  },

  async update(_id, _olds, news) {
    await apply(news);
    return { outs: news };
  },

  async read(id, props) {
    if (!props)
      throw new Error(`Listmonk settings "${id}" can't be imported; secrets are unreadable.`);

    const live = await current(props.connection);

    const values = Object.fromEntries(
      Object.keys(props.values).map((key) => [key, restore(live[key], props.values[key])]),
    );

    return { id, props: { ...props, values } };
  },

  // Listmonk always has settings; leaving them is all a delete can do.
  async delete() {},
};

export interface SettingsArgs {
  connection: pulumi.Input<ConnectionArgs>;
  // Keyed as GET /api/settings keys them (`app.root_url`, `smtp`, …). Unlisted settings are kept.
  values: pulumi.Input<Record<string, pulumi.Input<unknown>>>;
}

export class Settings extends pulumi.dynamic.Resource {
  constructor(name: string, args: SettingsArgs, options?: pulumi.CustomResourceOptions) {
    super(
      provider,
      name,
      args,
      { ...options, additionalSecretOutputs: ["connection", "values"] },
      "listmonk",
      "Settings",
    );
  }
}

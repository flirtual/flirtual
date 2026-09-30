import { type Api, FetchResource } from "@flirtual/pulumi-dynamic-fetch";

import { request, required } from "../client.ts";

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

const current = async (api: Api) =>
  required(await request<Values>(api, "GET", "/settings"), "Listmonk returned no settings.");

// The spec's Settings schema predates keys Listmonk has had since v3 (`bounce.actions`,
// `privacy.record_optin_ip`), so settings go by the running instance's keys instead.
async function apply(api: Api, values: Values) {
  // A PUT replaces every setting, so start from the current ones.
  const settings = unmask(await current(api)) as Values;

  const unknown = Object.keys(values).filter((key) => !(key in settings));
  if (unknown.length > 0) throw new Error(`Listmonk has no settings named ${unknown.join(", ")}.`);

  await request(api, "PUT", "/settings", { ...settings, ...values });

  return values;
}

// Keyed as GET /api/settings keys them (`app.root_url`, `smtp`, …). Unlisted settings are kept.
export class SettingsResource extends FetchResource<Values, Values> {
  readonly secretOutputs = ["output" as const];

  create(api: Api, inputs: Values) {
    return apply(api, inputs);
  }

  update(api: Api, _id: string, inputs: Values) {
    return apply(api, inputs);
  }

  async read(api: Api, _id: string, inputs: Values) {
    const keys = Object.keys(inputs);
    if (keys.length === 0)
      throw new Error("Listmonk settings can't be imported; secrets are unreadable.");

    const live = await current(api);
    return Object.fromEntries(keys.map((key) => [key, restore(live[key], inputs[key])]));
  }

  // Listmonk always has settings; leaving them is all a delete can do.
  async delete() {}

  id() {
    return "settings";
  }

  inputs(live: Values) {
    return live;
  }
}

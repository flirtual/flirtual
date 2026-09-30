import { type Api, define, type Operations } from "@flirtual/pulumi-dynamic-fetch";

import { call, pause, ready, required } from "../client.ts";

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
  required(await call<Values>(api, "GET", "/settings"), "Listmonk returned no settings.");

// The spec's Settings schema predates keys Listmonk has had since v3 (`bounce.actions`,
// `privacy.record_optin_ip`), so settings go by the running instance's keys instead.
async function apply(api: Api, values: Values) {
  await ready(api);

  // A PUT replaces every setting, so start from the current ones.
  const settings = unmask(await current(api)) as Values;

  const unknown = Object.keys(values).filter((key) => !(key in settings));
  if (unknown.length > 0) throw new Error(`Listmonk has no settings named ${unknown.join(", ")}.`);

  await call(api, "PUT", "/settings", { ...settings, ...values });

  // Saving settings restarts Listmonk in place.
  await pause(2000);
  await ready(api);

  return values;
}

export const settingsOperations: Operations<Values, Values> = {
  create: apply,
  update: (api, _id, inputs) => apply(api, inputs),
  async read(api, _id, inputs) {
    const keys = Object.keys(inputs);
    if (keys.length === 0)
      throw new Error("Listmonk settings can't be imported; secrets are unreadable.");

    const live = await current(api);
    return Object.fromEntries(keys.map((key) => [key, restore(live[key], inputs[key])]));
  },
  // Listmonk always has settings; leaving them is all a delete can do.
  delete: async () => {},
  id: () => "settings",
  inputs: (live) => live,
};

// Keyed as GET /api/settings keys them (`app.root_url`, `smtp`, …). Unlisted settings are kept.
export class Settings extends define({
  module: "listmonk",
  type: "Settings",
  secretOutputs: ["output"],
  ...settingsOperations,
}) {}

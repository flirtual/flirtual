import { define, type Operations } from "@flirtual/pulumi-dynamic-fetch";
import type * as pulumi from "@pulumi/pulumi";

import { call, type components, ready } from "../client.ts";

// What `listmonk --install` seeds besides list 1 and the templates. The example subscribers sit on
// list 1, so a newsletter would otherwise mail example.com and bounce.
const optinList = { id: 2, name: "Opt-in list" };
const subscribers = ["john@example.com", "anon@example.com"];

type Nothing = Record<string, never>;

export const sampleCleanupOperations: Operations<Nothing, Nothing> = {
  async create(api) {
    await ready(api);

    const list = await call<components["schemas"]["List"]>(api, "GET", `/lists/${optinList.id}`);
    if (list?.name === optinList.name) await call(api, "DELETE", `/lists/${optinList.id}`);

    const query = `subscribers.email in (${subscribers.map((email) => `'${email}'`).join(", ")})`;
    const found = await call<{ results?: Array<components["schemas"]["Subscriber"]> }>(
      api,
      "GET",
      `/subscribers?${new URLSearchParams({ per_page: "all", query })}`,
    );

    for (const { id } of found?.results ?? [])
      if (id !== undefined) await call(api, "DELETE", `/subscribers/${id}`);

    return {};
  },
  // Nothing remains to read, and it must not read as gone.
  read: async () => ({}),
  // Nothing to put back.
  delete: async () => {},
  id: () => "sample-cleanup",
};

export class SampleCleanup extends define({
  module: "listmonk",
  type: "SampleCleanup",
  ...sampleCleanupOperations,
}) {
  constructor(name: string, options?: pulumi.CustomResourceOptions) {
    super(name, {}, options);
  }
}

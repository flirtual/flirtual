import * as pulumi from "@pulumi/pulumi";

import { type Connection, type ConnectionArgs, connect, ready, unwrap } from "../client.ts";

interface SampleCleanupInputs {
  connection: Connection;
}

// What `listmonk --install` seeds besides list 1 and the templates. The example subscribers sit on
// list 1, so a newsletter would otherwise mail example.com and bounce.
const optinList = { id: 2, name: "Opt-in list" };
const subscribers = ["john@example.com", "anon@example.com"];

const provider: pulumi.dynamic.ResourceProvider<SampleCleanupInputs, SampleCleanupInputs> = {
  async diff(_id, olds, news) {
    return { changes: JSON.stringify(olds.connection) !== JSON.stringify(news.connection) };
  },

  async create(inputs) {
    const { connection } = inputs;
    const listmonk = await connect(connection);
    await ready(listmonk, connection.endpoint);

    const path = { params: { path: { list_id: optinList.id } } };
    const list = unwrap(await listmonk.GET("/lists/{list_id}", path));
    if (list?.name === optinList.name) unwrap(await listmonk.DELETE("/lists/{list_id}", path));

    const query = `subscribers.email in (${subscribers.map((email) => `'${email}'`).join(", ")})`;
    const found = unwrap(
      await listmonk.GET("/subscribers", { params: { query: { per_page: "all", query } } }),
    );

    for (const { id } of found?.results ?? [])
      if (id !== undefined)
        unwrap(await listmonk.DELETE("/subscribers/{id}", { params: { path: { id } } }));

    return { id: connection.endpoint, outs: inputs };
  },

  async update(_id, _olds, news) {
    return { outs: news };
  },

  // Nothing to put back.
  async delete() {},
};

export interface SampleCleanupArgs {
  connection: pulumi.Input<ConnectionArgs>;
}

export class SampleCleanup extends pulumi.dynamic.Resource {
  constructor(name: string, args: SampleCleanupArgs, options?: pulumi.CustomResourceOptions) {
    super(
      provider,
      name,
      args,
      { ...options, additionalSecretOutputs: ["connection"] },
      "listmonk",
      "SampleCleanup",
    );
  }
}

import * as pulumi from "@pulumi/pulumi";

import { Configured, unwrap } from "../client.ts";

// What `listmonk --install` seeds besides list 1 and the templates. The example subscribers sit on
// list 1, so a newsletter would otherwise mail example.com and bounce.
const optinList = { id: 2, name: "Opt-in list" };
const subscribers = ["john@example.com", "anon@example.com"];

class SampleCleanupProvider extends Configured implements pulumi.dynamic.ResourceProvider {
  async create() {
    const listmonk = await this.connect();
    await this.ready(listmonk);

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

    return { id: this.connection.endpoint, outs: {} };
  }

  // Nothing to put back.
  async delete() {}
}

export class SampleCleanup extends pulumi.dynamic.Resource {
  constructor(name: string, options?: pulumi.CustomResourceOptions) {
    super(new SampleCleanupProvider(), name, {}, options, "listmonk", "SampleCleanup");
  }
}

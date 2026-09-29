import * as pulumi from "@pulumi/pulumi";

import { type components, Configured, unwrap } from "../client.ts";

type ListFields = Required<components["schemas"]["NewList"]>;

interface ListInputs extends ListFields {
  listId?: number;
}

interface ListOutputs extends ListInputs {
  listId: number;
}

const fields = ({
  name = "",
  type = "private",
  optin = "single",
  tags = [],
  description = "",
}: components["schemas"]["NewList"]): ListFields => ({ name, type, optin, tags, description });

class ListProvider
  extends Configured
  implements pulumi.dynamic.ResourceProvider<ListInputs, ListOutputs>
{
  async diff(_id: string, olds: ListOutputs, news: ListInputs) {
    const replaces = news.listId !== undefined && news.listId !== olds.listId ? ["listId"] : [];

    const changed = (["name", "type", "optin", "description"] as const).some(
      (key) => JSON.stringify(olds[key]) !== JSON.stringify(news[key]),
    );

    return {
      changes: replaces.length > 0 || changed || olds.tags.join() !== news.tags.join(),
      replaces,
    };
  }

  async create(inputs: ListInputs) {
    const { listId } = inputs;
    const listmonk = await this.connect();
    await this.ready(listmonk);

    if (listId !== undefined) {
      const path = { params: { path: { list_id: listId } } };

      if (unwrap(await listmonk.GET("/lists/{list_id}", path))) {
        unwrap(await listmonk.PUT("/lists/{list_id}", { ...path, body: fields(inputs) }));
        return { id: String(listId), outs: { ...inputs, listId } };
      }
    }

    // Listmonk numbers lists itself, so a missing list only gets the id asked for when it's next.
    const created = unwrap(await listmonk.POST("/lists", { body: fields(inputs) }));
    if (created?.id === undefined)
      throw new Error(`Listmonk didn't return the list "${inputs.name}".`);
    if (listId !== undefined && created.id !== listId)
      throw new Error(`Listmonk created "${inputs.name}" as list ${created.id}, not ${listId}.`);

    return { id: String(created.id), outs: { ...inputs, listId: created.id } };
  }

  async update(id: string, _olds: ListOutputs, news: ListInputs) {
    const listmonk = await this.connect();

    unwrap(
      await listmonk.PUT("/lists/{list_id}", {
        params: { path: { list_id: Number(id) } },
        body: fields(news),
      }),
    );

    return { outs: { ...news, listId: Number(id) } };
  }

  async read(id: string, props?: ListOutputs) {
    if (!props) throw new Error(`Listmonk list "${id}" can't be imported without its inputs.`);

    const listmonk = await this.connect();
    const live = unwrap(
      await listmonk.GET("/lists/{list_id}", { params: { path: { list_id: Number(id) } } }),
    );
    if (!live) return {};

    // The spec types a stored list's `type` and `optin` as any string; whatever it holds shows up as
    // drift against the inputs.
    const { type, optin, ...rest } = live;
    const read = fields({
      ...rest,
      type: type as ListFields["type"],
      optin: optin as ListFields["optin"],
    });

    return { id, props: { ...props, ...read, listId: Number(id) } };
  }

  async delete(id: string) {
    const listmonk = await this.connect();
    unwrap(
      await listmonk.DELETE("/lists/{list_id}", { params: { path: { list_id: Number(id) } } }),
    );
  }
}

export interface ListArgs {
  // Takes over this list if it exists, and fails rather than create the list under another id.
  listId?: pulumi.Input<number>;
  name: pulumi.Input<string>;
  type: pulumi.Input<ListFields["type"]>;
  optin: pulumi.Input<ListFields["optin"]>;
  tags?: pulumi.Input<Array<pulumi.Input<string>>>;
  description?: pulumi.Input<string>;
}

export class List extends pulumi.dynamic.Resource {
  declare public readonly listId: pulumi.Output<number>;

  constructor(name: string, args: ListArgs, options?: pulumi.CustomResourceOptions) {
    super(
      new ListProvider(),
      name,
      { tags: [], description: "", ...args, listId: args.listId },
      options,
      "listmonk",
      "List",
    );
  }
}

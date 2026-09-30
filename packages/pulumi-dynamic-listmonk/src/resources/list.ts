import {
  type Api,
  type Args,
  type Body,
  define,
  type Operations,
} from "@flirtual/pulumi-dynamic-fetch";
import type * as pulumi from "@pulumi/pulumi";

import { call, type components, ready, required } from "../client.ts";

type Fields = Required<components["schemas"]["NewList"]>;
type Live = components["schemas"]["List"];

export interface ListInputs extends Fields {
  // Takes over this list if it exists, and fails rather than create the list under another id.
  listId?: number;
}

// The spec types a stored list's `type` and `optin` as any string; whatever it holds shows up as
// drift against the inputs.
const fields = ({
  name = "",
  type = "private",
  optin = "single",
  tags = [],
  description = "",
}: Partial<Record<keyof Fields, unknown>>): Fields & Body => ({
  name: name as Fields["name"],
  type: type as Fields["type"],
  optin: optin as Fields["optin"],
  tags: tags as Fields["tags"],
  description: description as Fields["description"],
});

async function takeOver(api: Api, inputs: ListInputs) {
  const { listId } = inputs;
  if (listId === undefined) return undefined;
  if (!(await call<Live>(api, "GET", `/lists/${listId}`))) return undefined;

  return call<Live>(api, "PUT", `/lists/${listId}`, fields(inputs));
}

export const listOperations: Operations<ListInputs, Live> = {
  async create(api, inputs) {
    await ready(api);

    const taken = await takeOver(api, inputs);
    if (taken) return taken;

    // Listmonk numbers lists itself, so a missing list only gets the id asked for when it's next.
    const created = required(
      await call<Live>(api, "POST", "/lists", fields(inputs)),
      `Listmonk didn't return the list "${inputs.name}".`,
    );
    if (inputs.listId !== undefined && created.id !== inputs.listId)
      throw new Error(
        `Listmonk created "${inputs.name}" as list ${created.id}, not ${inputs.listId}.`,
      );

    return created;
  },
  read: (api, id) => call<Live>(api, "GET", `/lists/${id}`),
  update: async (api, id, inputs) =>
    required(
      await call<Live>(api, "PUT", `/lists/${id}`, fields(inputs)),
      `Listmonk didn't return list ${id}.`,
    ),
  delete: async (api, id) => {
    await call(api, "DELETE", `/lists/${id}`);
  },
  id: (live) => String(live.id),
  inputs: (live) => ({ listId: live.id, ...fields(live) }),
  replaceOnChanges: ["listId"],
};

export type ListArgs = Omit<Args<ListInputs>, "tags" | "description"> &
  Partial<Pick<Args<ListInputs>, "tags" | "description">>;

export class List extends define({ module: "listmonk", type: "List", ...listOperations }) {
  constructor(name: string, args: ListArgs, options?: pulumi.CustomResourceOptions) {
    super(name, { tags: [], description: "", ...args }, options);
  }
}

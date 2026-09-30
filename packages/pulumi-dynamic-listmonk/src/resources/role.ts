import { type Args, define, type Operations } from "@flirtual/pulumi-dynamic-fetch";
import * as pulumi from "@pulumi/pulumi";

import { call, required } from "../client.ts";

interface RoleInputs {
  name: string;
  // As permissions.json names them (`subscribers:get_all`, `lists:manage_all`, …).
  permissions: Array<string>;
}

interface LiveRole extends RoleInputs {
  id: number;
}

const body = ({ name, permissions }: RoleInputs) => ({ name, permissions });

// A user role, as opposed to a list role. Listmonk rejects permissions it doesn't know
// (permissions.json in knadh/listmonk). /roles is missing from the spec (cmd/handlers.go).
export const roleOperations: Operations<RoleInputs, LiveRole> = {
  create: async (api, inputs) =>
    required(
      await call<LiveRole>(api, "POST", "/roles/users", body(inputs)),
      `Listmonk didn't return the role "${inputs.name}".`,
    ),
  // Listmonk has no route for a single role.
  read: async (api, id) =>
    (await call<Array<LiveRole>>(api, "GET", "/roles/users"))?.find(
      (role) => String(role.id) === id,
    ),
  update: async (api, id, inputs) =>
    required(
      await call<LiveRole>(api, "PUT", `/roles/users/${id}`, body(inputs)),
      `Listmonk didn't return role ${id}.`,
    ),
  delete: async (api, id) => {
    await call(api, "DELETE", `/roles/${id}`);
  },
  id: (live) => String(live.id),
  inputs: ({ name, permissions }) => ({ name, permissions: [...permissions].sort() }),
};

export type RoleArgs = Args<RoleInputs>;

export class Role extends define({ module: "listmonk", type: "Role", ...roleOperations }) {
  // Permissions are a set, so their order is no change.
  constructor(name: string, args: RoleArgs, options?: pulumi.CustomResourceOptions) {
    super(
      name,
      {
        ...args,
        permissions: pulumi
          .output(args.permissions)
          .apply((permissions) => [...permissions].sort()),
      },
      options,
    );
  }
}

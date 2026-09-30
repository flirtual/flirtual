import { type Api, FetchResource } from "@flirtual/pulumi-dynamic-fetch";

import { request, required } from "../client.ts";

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
export class RoleResource extends FetchResource<RoleInputs, LiveRole> {
  async create(api: Api, inputs: RoleInputs) {
    return required(
      await request<LiveRole>(api, "POST", "/roles/users", body(inputs)),
      `Listmonk didn't return the role "${inputs.name}".`,
    );
  }

  // Listmonk has no route for a single role.
  async read(api: Api, id: string) {
    return (await request<Array<LiveRole>>(api, "GET", "/roles/users"))?.find(
      (role) => String(role.id) === id,
    );
  }

  async update(api: Api, id: string, inputs: RoleInputs) {
    return required(
      await request<LiveRole>(api, "PUT", `/roles/users/${id}`, body(inputs)),
      `Listmonk didn't return role ${id}.`,
    );
  }

  async delete(api: Api, id: string) {
    await request(api, "DELETE", `/roles/${id}`);
  }

  id(live: LiveRole) {
    return String(live.id);
  }

  // Permissions are a set, so while Listmonk has the same ones, their stored order stands.
  inputs({ name, permissions }: LiveRole, inputs: RoleInputs) {
    const stored = new Set(inputs.permissions);
    const same =
      permissions.length === stored.size &&
      permissions.every((permission) => stored.has(permission));

    return { name, permissions: same ? inputs.permissions : permissions };
  }
}

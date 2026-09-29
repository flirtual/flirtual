import * as pulumi from "@pulumi/pulumi";

import { Configured } from "../client.ts";

interface RoleInputs {
  name: string;
  permissions: Array<string>;
}

interface LiveRole extends RoleInputs {
  id: number;
}

const body = ({ name, permissions }: RoleInputs) => ({ name, permissions });

// A user role, as opposed to a list role. Listmonk rejects permissions it doesn't know
// (permissions.json in knadh/listmonk).
class RoleProvider extends Configured implements pulumi.dynamic.ResourceProvider<RoleInputs> {
  async diff(_id: string, olds: RoleInputs, news: RoleInputs) {
    const changes =
      olds.name !== news.name ||
      [...olds.permissions].sort().join() !== [...news.permissions].sort().join();

    return { changes };
  }

  async create(inputs: RoleInputs) {
    const role = await this.request<LiveRole>("POST", "/roles/users", body(inputs));
    if (role === undefined) throw new Error(`Listmonk didn't return the role "${inputs.name}".`);

    return { id: String(role.id), outs: inputs };
  }

  async update(id: string, _olds: RoleInputs, news: RoleInputs) {
    await this.request("PUT", `/roles/users/${id}`, body(news));
    return { outs: news };
  }

  // Listmonk has no route for a single role.
  async read(id: string, props?: RoleInputs) {
    const roles = await this.request<Array<LiveRole>>("GET", "/roles/users");
    const role = roles?.find((role) => String(role.id) === id);
    if (!role) return {};

    return { id, props: { ...props, name: role.name, permissions: role.permissions } };
  }

  async delete(id: string) {
    await this.request("DELETE", `/roles/${id}`);
  }
}

export interface RoleArgs {
  name: pulumi.Input<string>;
  // As permissions.json names them (`subscribers:get_all`, `lists:manage_all`, …).
  permissions: pulumi.Input<Array<pulumi.Input<string>>>;
}

export class Role extends pulumi.dynamic.Resource {
  constructor(name: string, args: RoleArgs, options?: pulumi.CustomResourceOptions) {
    super(new RoleProvider(), name, args, options, "listmonk", "Role");
  }
}

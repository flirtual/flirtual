import * as pulumi from "@pulumi/pulumi";

import { Configured } from "../client.ts";

interface UserInputs {
  username: string;
  roleId: string;
}

interface UserOutputs extends UserInputs {
  token: string;
}

interface LiveUser {
  id: number;
  username: string;
  user_role_id: number;
  // An API user's token, returned only by the request that creates the user.
  password?: string;
}

const body = ({ username, roleId }: UserInputs) => ({
  username,
  name: username,
  type: "api",
  status: "enabled",
  user_role_id: Number(roleId),
});

// An API user. Listmonk generates its token on creation and never shows it again
// (internal/core/users.go in knadh/listmonk), so a lost token means replacing the user.
class UserProvider
  extends Configured
  implements pulumi.dynamic.ResourceProvider<UserInputs, UserOutputs>
{
  async diff(_id: string, olds: UserOutputs, news: UserInputs) {
    return { changes: olds.username !== news.username || olds.roleId !== news.roleId };
  }

  async create(inputs: UserInputs) {
    const user = await this.request<LiveUser>("POST", "/users", body(inputs));
    if (user?.password === undefined)
      throw new Error(`Listmonk didn't return a token for "${inputs.username}".`);

    return { id: String(user.id), outs: { ...inputs, token: user.password } };
  }

  async update(id: string, olds: UserOutputs, news: UserInputs) {
    await this.request("PUT", `/users/${id}`, body(news));
    return { outs: { ...news, token: olds.token } };
  }

  async read(id: string, props?: UserOutputs) {
    if (!props)
      throw new Error(`Listmonk user "${id}" can't be imported; its token is unreadable.`);

    const user = await this.request<LiveUser>("GET", `/users/${id}`);
    if (!user) return {};

    return {
      id,
      props: { ...props, username: user.username, roleId: String(user.user_role_id) },
    };
  }

  async delete(id: string) {
    await this.request("DELETE", `/users/${id}`);
  }
}

export interface UserArgs {
  username: pulumi.Input<string>;
  // The id of a Role.
  roleId: pulumi.Input<string>;
}

export class User extends pulumi.dynamic.Resource {
  declare public readonly username: pulumi.Output<string>;
  declare public readonly token: pulumi.Output<string>;

  constructor(name: string, args: UserArgs, options?: pulumi.CustomResourceOptions) {
    super(
      new UserProvider(),
      name,
      { ...args, token: undefined },
      { ...options, additionalSecretOutputs: ["token"] },
      "listmonk",
      "User",
    );
  }
}

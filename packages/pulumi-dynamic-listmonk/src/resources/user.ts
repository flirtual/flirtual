import { type Args, define, type Operations } from "@flirtual/pulumi-dynamic-fetch";
import * as pulumi from "@pulumi/pulumi";

import { call, required } from "../client.ts";

interface UserInputs {
  username: string;
  // The id of a Role.
  roleId: string;
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
// /users is missing from the spec (cmd/handlers.go).
export const userOperations: Operations<UserInputs, LiveUser> = {
  async create(api, inputs) {
    const user = await call<LiveUser>(api, "POST", "/users", body(inputs));
    if (user?.password === undefined)
      throw new Error(`Listmonk didn't return a token for "${inputs.username}".`);

    return user;
  },
  async read(api, id, _inputs, previous) {
    const password = previous?.password;
    if (password === undefined)
      throw new Error(`Listmonk user "${id}" can't be imported; its token is unreadable.`);

    const user = await call<LiveUser>(api, "GET", `/users/${id}`);
    return user && { ...user, password };
  },
  async update(api, id, inputs, olds) {
    const user = required(
      await call<LiveUser>(api, "PUT", `/users/${id}`, body(inputs)),
      `Listmonk didn't return user ${id}.`,
    );

    return { ...user, password: olds.output.password };
  },
  delete: async (api, id) => {
    await call(api, "DELETE", `/users/${id}`);
  },
  id: (live) => String(live.id),
  inputs: ({ username, user_role_id }) => ({ username, roleId: String(user_role_id) }),
};

export type UserArgs = Args<UserInputs>;

export class User extends define({
  module: "listmonk",
  type: "User",
  secretOutputs: ["output"],
  ...userOperations,
}) {
  declare readonly username: pulumi.Output<string>;
  readonly token: pulumi.Output<string>;

  constructor(name: string, args: UserArgs, options?: pulumi.CustomResourceOptions) {
    super(name, args, options);
    this.token = pulumi.secret(this.output.apply(({ password }) => password!));
  }
}

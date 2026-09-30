import { defineConfig } from "@flirtual/pulumi-dynamic-fetch";
import * as pulumi from "@pulumi/pulumi";

import { ListResource } from "./resources/list.ts";
import { RoleResource } from "./resources/role.ts";
import { SampleCleanupResource } from "./resources/sample-cleanup.ts";
import { SettingsResource } from "./resources/settings.ts";
import { UserResource } from "./resources/user.ts";

export const { Provider, List, Role, User, Settings, SampleCleanup } = defineConfig({
  module: "listmonk",
  // An API user's token goes in Basic auth as its password. The variables are the ones the API
  // reads (apps/api/config/runtime.exs).
  provider: (
    args: {
      endpoint?: pulumi.Input<string>;
      username?: pulumi.Input<string>;
      token?: pulumi.Input<string>;
    },
    { config },
  ) => {
    const {
      endpoint = process.env.LISTMONK_URL || config.require("endpoint"),
      username = process.env.LISTMONK_USERNAME || config.require("username"),
      token = process.env.LISTMONK_PASSWORD || config.requireSecret("token"),
    } = args;

    return {
      baseUrl: pulumi.output(endpoint).apply((endpoint) => new URL("/api", endpoint).href),
      headers: {
        authorization: pulumi
          .all([username, token])
          .apply(
            ([username, token]) =>
              `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`,
          ),
      },
    };
  },
  resources: {
    List: ListResource,
    Role: RoleResource,
    User: UserResource,
    Settings: SettingsResource,
    SampleCleanup: SampleCleanupResource,
  },
});

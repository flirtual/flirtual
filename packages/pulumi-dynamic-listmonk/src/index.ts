import { defineConfig } from "@flirtual/pulumi-dynamic-fetch";
import * as pulumi from "@pulumi/pulumi";

import { login } from "./login.ts";
import { ListResource } from "./resources/list.ts";
import { RoleResource } from "./resources/role.ts";
import { SampleCleanupResource } from "./resources/sample-cleanup.ts";
import { SettingsResource } from "./resources/settings.ts";
import { UserResource } from "./resources/user.ts";

export const { Provider, List, Role, User, Settings, SampleCleanup } = defineConfig({
	module: "listmonk",
	// Signs in as a user with a password, such as the admin an install creates.
	provider: (
		args: {
			endpoint?: pulumi.Input<string>;
			username?: pulumi.Input<string>;
			password?: pulumi.Input<string>;
			// Sent with every request, such as a Cloudflare Access service token for an instance behind it.
			headers?: pulumi.Input<Record<string, pulumi.Input<string>>>;
		},
		{ config },
	) => {
		const {
			endpoint = config.require("endpoint"),
			username = config.require("username"),
			password = config.requireSecret("password"),
			headers = {},
		} = args;

		return {
			baseUrl: pulumi.output(endpoint).apply((endpoint) => new URL("/api", endpoint).href),
			headers,
			credentials: { username, password },
		};
	},
	authenticate: login,
	resources: {
		List: ListResource,
		Role: RoleResource,
		User: UserResource,
		Settings: SettingsResource,
		SampleCleanup: SampleCleanupResource,
	},
});

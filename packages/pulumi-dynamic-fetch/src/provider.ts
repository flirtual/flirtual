import * as pulumi from "@pulumi/pulumi";

import type { Connection, Encoding } from "./api.ts";

// A `pulumi-nodejs` provider's inputs reach `configure` as its config, which `Config.require`
// scopes to the project unless a key names its own namespace
// (@pulumi/pulumi/cmd/dynamic-provider/config.js).
export const configKey = (name: keyof Connection | "credentials") => `fetch:${name}`;

export type Credentials = Record<string, string>;

export interface ProviderArgs {
	baseUrl: pulumi.Input<string>;
	// Credentials belong here rather than on each resource, so they stay out of resource state.
	headers?: pulumi.Input<Record<string, pulumi.Input<string>>>;
	encoding?: pulumi.Input<Encoding>;
	// For a config's `authenticate`, which trades them for headers when the provider starts.
	credentials?: pulumi.Input<Record<string, pulumi.Input<string>>>;
}

export class Provider extends pulumi.ProviderResource {
	constructor(name: string, args: ProviderArgs, options?: pulumi.ResourceOptions) {
		super(
			"pulumi-nodejs",
			name,
			{
				[configKey("baseUrl")]: args.baseUrl,
				[configKey("headers")]: pulumi.secret(pulumi.jsonStringify(args.headers ?? {})),
				[configKey("encoding")]: args.encoding ?? "json",
				...(args.credentials && {
					[configKey("credentials")]: pulumi.secret(pulumi.jsonStringify(args.credentials)),
				}),
			},
			options,
		);
	}
}

export function credentialsFrom(config: pulumi.dynamic.ConfigureRequest["config"]): Credentials {
	return JSON.parse(config.require(configKey("credentials"))) as Credentials;
}

export function connectionFrom(config: pulumi.dynamic.ConfigureRequest["config"]): Connection {
	const encoding = config.require(configKey("encoding"));
	if (encoding !== "json" && encoding !== "form")
		throw new Error(`Unknown encoding "${encoding}"; expected "json" or "form".`);

	return {
		baseUrl: config.require(configKey("baseUrl")),
		headers: JSON.parse(config.require(configKey("headers"))) as Record<string, string>,
		encoding,
	};
}

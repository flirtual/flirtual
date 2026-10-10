import { moduleProvider } from "@flirtual/pulumi-utils";
import * as pulumi from "@pulumi/pulumi";

import { deployedConfig, splitSecrets } from "./config.ts";
import type { BuildSettings, DeployedConfig } from "./config.ts";
import type { BuildRecord } from "./providers/build-output.ts";

export const provider = moduleProvider(
	() => import("@flirtual/pulumi-cloudflare-utils/providers/deployment"),
);

export interface DeploymentArgs {
	accountId: pulumi.Input<string>;

	/** The build to deploy, typically a `BuildOutput`. When its files are gone or changed, it's rebuilt before deploying. */
	build: {
		project: pulumi.Input<string>;
		command: pulumi.Input<string>;
		environment: pulumi.Input<Record<string, pulumi.Input<string>>>;

		/** The `BuildRecord`, as JSON. */
		record: pulumi.Input<string>;
	};

	/** The config to deploy, given the build's settings. Every binding the build's code uses must be here, a secret with its `value`. */
	apply: (settings: BuildSettings) => DeployedConfig;

	tag?: pulumi.Input<string>;
}

/** Deploys a project's Build Output as `cf deploy --prebuilt` does: its settings, one Worker, and its containers. */
export class Deployment extends pulumi.dynamic.Resource {
	constructor(name: string, args: DeploymentArgs, options?: pulumi.CustomResourceOptions) {
		const deployed = pulumi
			.output(args.build.record)
			.apply((record) =>
				splitSecrets(deployedConfig((JSON.parse(record) as BuildRecord).config, args.apply)),
			);

		super(
			provider,
			name,
			{
				accountId: args.accountId,
				project: args.build.project,
				command: args.build.command,
				environment: args.build.environment,
				record: args.build.record,
				config: deployed
					.apply(({ config }) => pulumi.output(config))
					.apply((config) => JSON.stringify(config)),
				secrets: deployed.apply(({ secrets }) => pulumi.output(secrets)),
				tag: args.tag,
			},
			{ ...options, additionalSecretOutputs: ["secrets", "environment"] },
			"cf",
			"Deployment",
		);
	}
}

import { moduleProvider } from "@flirtual/pulumi-utils";
import * as pulumi from "@pulumi/pulumi";

export const provider = moduleProvider(
	() => import("@flirtual/pulumi-cloudflare-utils/providers/build-output"),
);

export interface BuildOutputArgs {
	/** The project to build, which holds the Build Output afterwards. */
	project: pulumi.Input<string>;

	/** A shell command that writes the project's Build Output. */
	command: pulumi.Input<string>;

	environment?: Record<string, pulumi.Input<string>>;

	/** The Worker to record, by `name`; the default Worker otherwise. */
	worker?: pulumi.Input<string>;

	/** Values whose change rebuilds the project, such as a digest of its sources. */
	triggers?: Array<pulumi.Input<unknown>>;
}

/** Builds a project and records one of its Workers, for a `Deployment` to deploy, and to rebuild once the files are gone. */
export class BuildOutput extends pulumi.dynamic.Resource {
	declare public readonly project: pulumi.Output<string>;
	declare public readonly command: pulumi.Output<string>;
	declare public readonly environment: pulumi.Output<Record<string, string>>;
	declare public readonly record: pulumi.Output<string>;

	constructor(name: string, args: BuildOutputArgs, options?: pulumi.CustomResourceOptions) {
		super(
			provider,
			name,
			{
				project: args.project,
				command: args.command,
				environment: args.environment ?? {},
				worker: args.worker,
				triggers: args.triggers ?? [],
				record: undefined,
			},
			{ ...options, additionalSecretOutputs: ["environment"] },
			"cf",
			"BuildOutput",
		);
	}
}

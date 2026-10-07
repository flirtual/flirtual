import * as pulumi from "@pulumi/pulumi";

import { fly, flyJson } from "../client.ts";

interface CommandInputs {
	app: string;
	image: string;
	region: string;
	command: string;
	environment: Record<string, string>;
}

interface CommandOutputs extends CommandInputs {
	output: string;
}

// Wraps a value in single quotes, so a POSIX shell reads it back unchanged.
export const shellQuote = (value: string) => `'${value.replaceAll("'", `'\\''`)}'`;

// The command runs over SSH rather than as the machine's own process, so its output reaches only
// us and never the app's logs.
async function run({ app, image, region, command, environment }: CommandInputs) {
	const { randomBytes } = await import("node:crypto");
	const name = `pulumi-command-${randomBytes(4).toString("hex")}`;

	await fly`machine run ${image} sleep 3600 --app ${app} --name ${name} --region ${region} --restart no --detach`;

	const machines = await flyJson<Array<{ id: string; name: string }>>`machine list --app ${app}`;
	const machine = machines.find((machine) => machine.name === name);
	if (!machine) throw new Error(`Fly started no machine named ${name} in ${app}.`);

	try {
		await fly`machine wait ${machine.id} --app ${app} --state started`;

		const assignments = Object.entries(environment).map(
			([key, value]) => `${key}=${shellQuote(value)}`,
		);
		const script = ["env", ...assignments, command].join(" ");

		const output =
			await fly`ssh console --app ${app} --machine ${machine.id} --quiet --command ${`sh -c ${shellQuote(script)}`}`;
		return { name, output };
	} finally {
		await fly`machine destroy ${machine.id} --app ${app} --force`;
	}
}

export const provider: pulumi.dynamic.ResourceProvider<CommandInputs, CommandOutputs> = {
	// What ran can't be changed; a different command runs anew.
	async diff(_id, olds, news) {
		const replaces = (["app", "image", "region", "command", "environment"] as const).filter(
			(key) => JSON.stringify(olds[key]) !== JSON.stringify(news[key]),
		);

		return { changes: replaces.length > 0, replaces };
	},

	// Named after the one-off machine it ran in.
	async create(inputs) {
		const { name, output } = await run(inputs);

		return { id: name, outs: { ...inputs, output } };
	},
};

export interface CommandArgs {
	app: pulumi.Input<string>;
	// Needs `sleep` and `sh`, which keep the machine up and run the command.
	image: pulumi.Input<string>;
	region: pulumi.Input<string>;
	// Run by `sh -c`, with `environment` set.
	command: pulumi.Input<string>;
	environment?: pulumi.Input<Record<string, pulumi.Input<string>>>;
}

// Runs a command once, in a one-off machine of an app's image and private network, and keeps
// what it printed. Changing an input runs it again.
export class Command extends pulumi.dynamic.Resource {
	declare readonly output: pulumi.Output<string>;

	constructor(name: string, args: CommandArgs, options?: pulumi.CustomResourceOptions) {
		super(
			provider,
			name,
			{ ...args, environment: args.environment ?? {}, output: undefined },
			{ ...options, additionalSecretOutputs: ["output", "environment"] },
			"fly",
			"Command",
		);
	}
}

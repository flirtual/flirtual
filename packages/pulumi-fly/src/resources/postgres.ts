import * as pulumi from "@pulumi/pulumi";

import { fly, flyDelete, flyJson } from "../client.ts";
import { App, type AppArgs } from "./app.ts";

interface PostgresInputs {
	name: string;
	organization: string;
	network: string;
	region: string;
	password: string;
	clusterSize: number;
	volumeSize: number;
	memory: number;
	alwaysOn?: boolean;
}

interface PostgresOutputs extends PostgresInputs {
	idleTimeout?: string;
}

interface FlyApp {
	Name: string;
}

interface FlyMachine {
	id: string;
}

// flyctl's own scale-to-zero for a single-node cluster, which `fly pg create` only offers in its
// interactive prompt: https://github.com/superfly/flyctl/blob/master/flypg/launcher.go
const idleTimeout = "1h";

// An empty value fails to parse, which postgres-flex takes as "never stop"; flyctl can't unset it.
const timeoutFor = ({ alwaysOn }: PostgresInputs) => (alwaysOn ? "" : idleTimeout);

async function setIdleTimeout(app: string, timeout: string) {
	const machines = await flyJson<Array<FlyMachine>>`machines list --app ${app}`;

	await Promise.all(
		machines.map(
			({ id }) =>
				fly`machine update ${id} --app ${app} --env ${`FLY_SCALE_TO_ZERO=${timeout}`}
          --autostart=true --restart on-failure --yes`,
		),
	);
}

export const provider: pulumi.dynamic.ResourceProvider<PostgresInputs, PostgresOutputs> = {
	async check(_olds, news) {
		const help = await fly`pg create --help`.catch(() => "");

		return {
			inputs: news,
			failures: help.includes("--network")
				? []
				: [
						{
							property: "network",
							reason:
								"`fly pg create` has no --network. Put the flyctl fork first on PATH (packages/pulumi-fly/flyctl.md).",
						},
					],
		};
	},

	async diff(_id, olds, news) {
		const replaces = (
			[
				"name",
				"organization",
				"network",
				"region",
				"password",
				"clusterSize",
				"volumeSize",
				"memory",
			] as const
		).filter((key) => olds[key] !== news[key]);

		return { changes: replaces.length > 0 || olds.idleTimeout !== timeoutFor(news), replaces };
	},

	async create(inputs) {
		const { name, organization, network, region, password, clusterSize, volumeSize, memory } =
			inputs;

		await fly`pg create --flex --name ${name} --org ${organization} --network ${network}
      --region ${region} --password ${password}
      --initial-cluster-size ${String(clusterSize)} --volume-size ${String(volumeSize)}
      --vm-cpu-kind shared --vm-cpus 1 --vm-memory ${String(memory)}`;

		const timeout = timeoutFor(inputs);
		if (timeout) await setIdleTimeout(name, timeout);

		return { id: name, outs: { ...inputs, idleTimeout: timeout } };
	},

	async update(_id, olds, news) {
		const timeout = timeoutFor(news);
		if (olds.idleTimeout !== timeout) await setIdleTimeout(news.name, timeout);

		return { outs: { ...news, idleTimeout: timeout } };
	},

	async read(id, props) {
		if (!props)
			throw new Error(`Fly Postgres "${id}" cannot be imported; its password is unreadable.`);

		const app = await flyJson<FlyApp>`status --app ${id}`;
		return { id, props: { ...props, name: app.Name } };
	},

	async delete(id) {
		await flyDelete`apps destroy ${id} --yes`;
	},
};

export interface PostgresArgs extends AppArgs {
	network: pulumi.Input<string>;
	region: pulumi.Input<string>;
	password: pulumi.Input<string>;
	clusterSize: pulumi.Input<number>;
	volumeSize: pulumi.Input<number>;
	memory: pulumi.Input<number>;
	// Keeps the cluster running instead of stopping it after an idle hour.
	alwaysOn?: pulumi.Input<boolean>;
}

export class Postgres extends App {
	declare public readonly password: pulumi.Output<string>;

	constructor(name: string, args: PostgresArgs, options?: pulumi.CustomResourceOptions) {
		super(
			name,
			args,
			{ ...options, additionalSecretOutputs: ["password"] },
			{ provider, type: "Postgres" },
		);
	}

	public get superuser() {
		return {
			host: this.flycastHost,
			port: 5432,
			username: "postgres",
			database: "postgres",
			password: this.password,
		};
	}
}

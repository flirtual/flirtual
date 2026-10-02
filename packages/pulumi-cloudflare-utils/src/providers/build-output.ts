import { relative } from "node:path";
import { isDeepStrictEqual } from "node:util";

import type { BuildOutputWorkers, ResolvedOutputWorkerConfig } from "@cloudflare/build-output-utils";
import {
	DEFAULT_WORKER_DIRECTORY_NAME as defaultWorkerDirectory,
	getRootConfigPath,
	getWorkerDir,
	readBuildOutput,
} from "@cloudflare/build-output-utils";
import { hashFiles } from "@flirtual/pulumi-utils";
import type * as pulumi from "@pulumi/pulumi";

import { run } from "./client.ts";

/** What a build produced for one Worker, kept by Pulumi so it needs no build files between builds. */
export interface BuildRecord {
	directory: string;
	config: ResolvedOutputWorkerConfig;
	digest: string;
}

/** Digests the files `cf deploy` reads for one Worker: the root config and the Worker's directory. */
export const digestWorker = (project: string, directory: string) =>
	hashFiles(
		[relative(project, getRootConfigPath(project)), `${relative(project, getWorkerDir(project, directory))}/**`],
		{ cwd: project, dot: true, gitignore: false },
	);

function findDirectory(project: string, workers: BuildOutputWorkers, worker: string | undefined) {
	if (worker === undefined) return defaultWorkerDirectory;

	const directories = Object.keys(workers).filter((directory) => workers[directory]!.config.name === worker);

	if (directories.length > 1) throw new Error(`The Build Output in ${project} contains more than one Worker named "${worker}".`);

	if (directories[0] === undefined) {
		const { default: fallback, ...others } = workers;
		const names = [`${fallback.config.name} (default)`, ...Object.values(others).map(({ config }) => config.name).sort()];

		throw new Error(`The Build Output in ${project} has no Worker named "${worker}". It has: ${names.join(", ")}.`);
	}

	return directories[0];
}

/** Records a Worker in the project's Build Output, selected as `cf deploy --worker` selects it: by `name`, or the default Worker. */
export async function recordBuild(project: string, { worker }: { worker?: string } = {}): Promise<BuildRecord> {
	const { workers } = await readBuildOutput(project);
	const directory = findDirectory(project, workers, worker);

	return { directory, config: workers[directory]!.config, digest: digestWorker(project, directory) };
}

export interface BuildInputs {
	project: string;
	command: string;
	environment: Record<string, string>;
	worker?: string;
	triggers: Array<unknown>;
}

export interface BuildOutputs extends BuildInputs {
	/** The `BuildRecord`, as JSON. */
	record: string;
}

async function build(inputs: BuildInputs): Promise<BuildOutputs> {
	await run(inputs.command, { cwd: inputs.project, environment: inputs.environment });

	return { ...inputs, record: JSON.stringify(await recordBuild(inputs.project, { worker: inputs.worker })) };
}

const compared = ["project", "command", "environment", "worker", "triggers"] as const;

export async function diff(_id: string, olds: BuildOutputs, news: BuildInputs) {
	return { changes: compared.some((key) => !isDeepStrictEqual(olds[key], news[key])) };
}

export async function create(inputs: BuildInputs) {
	return { id: inputs.project, outs: await build(inputs) };
}

export async function update(_id: string, _olds: BuildOutputs, news: BuildInputs) {
	return { outs: await build(news) };
}

export default { diff, create, update } satisfies pulumi.dynamic.ResourceProvider<BuildInputs, BuildOutputs>;

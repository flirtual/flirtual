import { existsSync } from "node:fs";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import {
	BUILD_OUTPUT_ROOT as buildOutputRoot,
	DEFAULT_WORKER_DIRECTORY_NAME as defaultWorkerDirectory,
	getRootConfigPath,
	readBuildOutput,
	writeWorkerConfig,
} from "@cloudflare/build-output-utils";
import type { ParsedOutputRootConfig, ParsedOutputWorkerConfig } from "@cloudflare/config";
import * as pulumi from "@pulumi/pulumi";

import { digestWorker } from "./build-output.ts";
import type { BuildRecord } from "./build-output.ts";
import { cf, run } from "./client.ts";

export interface DeploymentInputs {
	accountId: string;
	project: string;
	command: string;
	environment: Record<string, string>;
	record: string;
	config: string;
	secrets: Record<string, string>;
	tag?: string;
}

async function deploy(
	inputs: DeploymentInputs,
	removed: Array<string> = [],
): Promise<DeploymentInputs> {
	const record: BuildRecord = JSON.parse(inputs.record);
	const recorded =
		existsSync(getRootConfigPath(inputs.project)) &&
		digestWorker(inputs.project, record.directory) === record.digest;

	if (!recorded) {
		await run(inputs.command, { cwd: inputs.project, environment: inputs.environment });

		const { workers } = await readBuildOutput(inputs.project);

		if (!isDeepStrictEqual(workers[record.directory]?.config, record.config))
			throw new Error(
				`Rebuilding ${inputs.project} gave a different Worker config than the recorded build, so the deployed config would be out of date. Replace the BuildOutput resource (\`pulumi up --replace <urn>\`) to build and record it again.`,
			);
	}

	const directory = await mkdtemp(path.join(tmpdir(), "cf-deploy-"));

	try {
		await cp(path.join(inputs.project, buildOutputRoot), path.join(directory, buildOutputRoot), {
			recursive: true,
		});

		const { rootConfig } = await readBuildOutput(directory);
		const { buildContext } = rootConfig;

		const worker: ParsedOutputWorkerConfig = JSON.parse(inputs.config);
		const { manifest, ...config } = worker;

		await writeWorkerConfig({ root: directory, config, manifest, directoryName: record.directory });
		await writeFile(
			getRootConfigPath(directory),
			JSON.stringify({
				...rootConfig,
				accountId: inputs.accountId,
			} satisfies ParsedOutputRootConfig),
		);
		await readBuildOutput(directory);

		const secretsFile = path.join(directory, "secrets.json");
		await writeFile(secretsFile, JSON.stringify(inputs.secrets), { mode: 0o600 });

		// Always passing a secrets file keeps the Worker's other secrets (cloudflare/cf#72).
		await cf(
			[
				"deploy",
				"--prebuilt",
				...(buildContext?.mode ? ["--mode", buildContext.mode] : []),
				...(record.directory === defaultWorkerDirectory ? [] : ["--worker", worker.name]),
				"--secrets-file",
				secretsFile,
				...(inputs.tag ? ["--tag", inputs.tag] : []),
			],
			{ cwd: directory, accountId: inputs.accountId },
		);

		for (const secret of removed)
			await cf(["workers", "secrets", "delete", secret, "--worker", worker.name, "--force"], {
				accountId: inputs.accountId,
			});
	} finally {
		await rm(directory, { recursive: true, force: true });
	}

	return inputs;
}

const compared = ["accountId", "project", "record", "secrets", "tag"] as const;

const sameConfig = (olds: DeploymentInputs, news: DeploymentInputs) =>
	news.config !== pulumi.runtime.unknownValue &&
	isDeepStrictEqual(JSON.parse(olds.config), JSON.parse(news.config));

export async function diff(_id: string, olds: DeploymentInputs, news: DeploymentInputs) {
	return {
		changes:
			compared.some((key) => !isDeepStrictEqual(olds[key], news[key])) || !sameConfig(olds, news),
	};
}

export async function create(inputs: DeploymentInputs) {
	return { id: JSON.parse(inputs.config).name, outs: await deploy(inputs) };
}

export async function update(_id: string, olds: DeploymentInputs, news: DeploymentInputs) {
	const removed = Object.keys(olds.secrets).filter((name) => !(name in news.secrets));

	return { outs: await deploy(news, removed) };
}

export default { diff, create, update } satisfies pulumi.dynamic.ResourceProvider<
	DeploymentInputs,
	DeploymentInputs
>;

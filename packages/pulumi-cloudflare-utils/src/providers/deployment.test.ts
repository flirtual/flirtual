import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { BuildOutputError } from "@cloudflare/build-output-utils";
import type { ParsedOutputWorkerConfig } from "@cloudflare/config";
import * as pulumi from "@pulumi/pulumi";
import { beforeEach, expect, it, vi } from "vitest";

import { recordBuild } from "./build-output.ts";
import { cf } from "./client.ts";
import { create, diff, update } from "./deployment.ts";
import type { DeploymentInputs } from "./deployment.ts";

vi.mock("./client.ts", async (original) => ({
	...(await original<typeof import("./client.ts")>()),
	cf: vi.fn(),
}));

const project = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "project");
const workerConfig = (root: string, directory = "default"): ParsedOutputWorkerConfig =>
	JSON.parse(
		readFileSync(
			join(root, `.cloudflare/output/v0/workers/${directory}/worker.config.json`),
			"utf8",
		),
	);
const built = workerConfig(project);

const record = await recordBuild(project);

const deployed: ParsedOutputWorkerConfig = {
	...built,
	name: "example-production",
	domains: ["example.com"],
	triggers: [{ type: "queue", name: "uploads-production" }],
	env: {
		...built.env,
		UPLOADS: { type: "r2", name: "uploads-production" },
		API_URL: { type: "text", value: "https://api.example" },
	},
};

const script = (source: string) => `node -e ${JSON.stringify(source.replaceAll(/\s*\n\s*/g, " "))}`;
const neverBuilds = script(`console.error("the recorded build was rebuilt"); process.exit(9);`);

const inputs: DeploymentInputs = {
	accountId: "account",
	project,
	command: neverBuilds,
	environment: {},
	record: JSON.stringify(record),
	config: JSON.stringify(deployed),
	secrets: { TOKEN: "token" },
	tag: "1.2.3",
};

interface Deployed {
	args: Array<string>;
	accountId: string;
	config: unknown;
	otherConfig: unknown;
	rootConfig: unknown;
	index: string;
	secrets: unknown;
}

const calls = vi.mocked(cf);
let deploys: Array<Deployed> = [];

beforeEach(() => {
	deploys = [];
	calls.mockReset();
	calls.mockImplementation(async (args, { cwd, accountId }) => {
		if (args[0] !== "deploy") return "";
		const secretsFile = args[args.indexOf("--secrets-file") + 1]!;
		deploys.push({
			args,
			accountId,
			config: workerConfig(cwd!),
			otherConfig: workerConfig(cwd!, "other"),
			rootConfig: JSON.parse(readFileSync(join(cwd!, ".cloudflare/output/v0/config.json"), "utf8")),
			index: readFileSync(
				join(cwd!, ".cloudflare/output/v0/workers/default/assets/index.html"),
				"utf8",
			),
			secrets: JSON.parse(readFileSync(secretsFile, "utf8")),
		});
		return "";
	});
});

it("deploys a copy of the project's build carrying the given config, leaving the build itself alone", async () => {
	const result = await create(inputs);

	expect(result.id).toBe("example-production");
	expect(deploys).toHaveLength(1);
	expect(deploys[0]!.args).toStrictEqual([
		"deploy",
		"--prebuilt",
		"--mode",
		"development",
		"--secrets-file",
		expect.any(String),
		"--tag",
		"1.2.3",
	]);
	expect(deploys[0]!.accountId).toBe("account");
	expect(deploys[0]!.config).toStrictEqual(deployed);
	expect(deploys[0]!.secrets).toStrictEqual({ TOKEN: "token" });
	expect(workerConfig(project)).toStrictEqual(built);
});

const rebuildFrom = (fixture: string, extra = "") =>
	script(
		`const fs = require("node:fs");
		fs.rmSync(".cloudflare", { recursive: true, force: true });
		fs.cpSync(${JSON.stringify(join(fixture, ".cloudflare"))}, ".cloudflare", { recursive: true });
		fs.writeFileSync("rebuilt-with", process.env.MARKER);
		${extra}`,
	);
const rebuildInputs = (root: string, extra?: string): DeploymentInputs => ({
	...inputs,
	project: root,
	command: rebuildFrom(project, extra),
	environment: { MARKER: "from-pulumi" },
});

it("rebuilds a checkout that has no Build Output, then deploys it", async () => {
	const root = mkdtempSync(join(tmpdir(), "checkout-"));

	await create(rebuildInputs(root));

	expect(readFileSync(join(root, "rebuilt-with"), "utf8")).toBe("from-pulumi");
	expect(deploys).toHaveLength(1);
	expect(deploys[0]!.config).toStrictEqual(deployed);
});

it("rebuilds a Build Output that differs from the recorded one, deploying the new bytes", async () => {
	const root = mkdtempSync(join(tmpdir(), "checkout-"));
	cpSync(project, root, { recursive: true });
	writeFileSync(join(root, ".cloudflare/output/v0/workers/default/assets/index.html"), "stale\n");

	await create(
		rebuildInputs(
			root,
			`fs.writeFileSync(".cloudflare/output/v0/workers/default/assets/index.html", "rebuilt\\n");`,
		),
	);

	expect(readFileSync(join(root, "rebuilt-with"), "utf8")).toBe("from-pulumi");
	expect(deploys).toHaveLength(1);
	expect(deploys[0]!.index).toBe("rebuilt\n");
});

it("refuses a rebuild that changes the Worker's config, since the deployed config came from the record", async () => {
	const root = mkdtempSync(join(tmpdir(), "checkout-"));
	const changeDate = `const file = ".cloudflare/output/v0/workers/default/worker.config.json";
		fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(fs.readFileSync(file, "utf8")), compatibilityDate: "2026-01-01" }));`;

	await expect(create(rebuildInputs(root, changeDate))).rejects.toThrow(
		`Rebuilding ${root} gave a different Worker config than the recorded build, so the deployed config would be out of date. Replace the BuildOutput resource (\`pulumi up --replace <urn>\`) to build and record it again.`,
	);
	expect(calls).not.toHaveBeenCalled();
});

it("reports a failed rebuild without deploying", async () => {
	const root = mkdtempSync(join(tmpdir(), "checkout-"));

	await expect(create({ ...inputs, project: root })).rejects.toThrow(
		`\`${neverBuilds}\` failed with exit code 9.\nthe recorded build was rebuilt`,
	);
	expect(existsSync(join(root, ".cloudflare"))).toBe(false);
	expect(calls).not.toHaveBeenCalled();
});

it("deploys to its own account, overriding one the project's settings name", async () => {
	const root = mkdtempSync(join(tmpdir(), "checkout-"));
	cpSync(project, root, { recursive: true });
	writeFileSync(
		join(root, ".cloudflare/output/v0/config.json"),
		JSON.stringify({
			accountId: "development-account",
			complianceRegion: "public",
			buildContext: { isPreview: false, mode: "development" },
		}),
	);

	await create({ ...inputs, project: root, record: JSON.stringify(await recordBuild(root)) });

	expect(deploys[0]!.rootConfig).toStrictEqual({
		accountId: "account",
		complianceRegion: "public",
		buildContext: { isPreview: false, mode: "development" },
	});
});

it("deploys another Worker in the Build Output by the name it's deployed under", async () => {
	const other = await recordBuild(project, { worker: "other" });
	const config = { ...other.config, name: "other-production" };

	await create({ ...inputs, record: JSON.stringify(other), config: JSON.stringify(config) });

	expect(deploys[0]!.args).toStrictEqual([
		"deploy",
		"--prebuilt",
		"--mode",
		"development",
		"--worker",
		"other-production",
		"--secrets-file",
		expect.any(String),
		"--tag",
		"1.2.3",
	]);
	expect(deploys[0]!.otherConfig).toStrictEqual(config);
	expect(deploys[0]!.config).toStrictEqual(built);
});

it("refuses a malformed config before deploying, as cf deploy reads it", async () => {
	const deployment = create({
		...inputs,
		config: JSON.stringify({ ...deployed, domains: "example.com" }),
	});

	await expect(deployment).rejects.toThrow(BuildOutputError);
	await expect(deployment).rejects.toThrow(
		/invalid Worker config at .*workers\/default\/worker\.config\.json\.\n.*domains/s,
	);
	expect(calls).not.toHaveBeenCalled();
});

it("deletes secrets a new deploy no longer carries", async () => {
	await update(
		"example-production",
		{ ...inputs, secrets: { TOKEN: "token", OLD: "old" } },
		inputs,
	);

	expect(deploys).toHaveLength(1);
	expect(calls).toHaveBeenLastCalledWith(
		["workers", "secrets", "delete", "OLD", "--worker", "example-production", "--force"],
		{ accountId: "account" },
	);
});

it("redeploys when the build, config or secrets change, and only then", async () => {
	const renamed = JSON.stringify({ ...deployed, name: "renamed" });

	expect(await diff("example-production", inputs, { ...inputs, config: renamed })).toStrictEqual({
		changes: true,
	});
	const rebuilt = JSON.stringify({ ...record, digest: "1".repeat(64) });
	expect(await diff("example-production", inputs, { ...inputs, record: rebuilt })).toStrictEqual({
		changes: true,
	});
	expect(
		await diff("example-production", inputs, { ...inputs, secrets: { TOKEN: "rotated" } }),
	).toStrictEqual({ changes: true });
	expect(await diff("example-production", inputs, { ...inputs })).toStrictEqual({ changes: false });
});

it("redeploys when the config isn't known yet, as in a preview where a resource it names changes", async () => {
	expect(
		await diff("example-production", inputs, { ...inputs, config: pulumi.runtime.unknownValue }),
	).toStrictEqual({ changes: true });
});

it("leaves an equal config alone, whatever order its keys come in", async () => {
	const { env, ...rest } = deployed;
	const reordered = JSON.stringify({ ...rest, env });

	expect(reordered).not.toBe(inputs.config);
	expect(await diff("example-production", inputs, { ...inputs, config: reordered })).toStrictEqual({
		changes: false,
	});
});

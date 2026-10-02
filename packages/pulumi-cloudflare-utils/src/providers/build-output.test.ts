import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { BuildOutputError } from "@cloudflare/build-output-utils";
import type { ResolvedOutputWorkerConfig } from "@cloudflare/build-output-utils";
import { hashFiles } from "@flirtual/pulumi-utils";
import { expect, expectTypeOf, it } from "vitest";

import { create, diff, recordBuild } from "./build-output.ts";
import type { BuildInputs } from "./build-output.ts";

const project = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "project");
const output = join(project, ".cloudflare/output/v0");

const config = (directory: string) =>
	JSON.parse(readFileSync(join(output, "workers", directory, "worker.config.json"), "utf8"));
const digest = (directory: string) =>
	hashFiles([".cloudflare/output/v0/config.json", `.cloudflare/output/v0/workers/${directory}/**`], { cwd: project, dot: true, gitignore: false });

const copy = () => {
	const root = mkdtempSync(join(tmpdir(), "record-"));
	cpSync(project, root, { recursive: true });
	return root;
};

it("records the default Worker's config and a digest of its files", async () => {
	expect(await recordBuild(project)).toStrictEqual({ directory: "default", config: config("default"), digest: digest("default") });
});

it("records another Worker by its name, as cf deploy --worker selects it", async () => {
	expect(await recordBuild(project, { worker: "other" })).toStrictEqual({ directory: "other", config: config("other"), digest: digest("other") });
});

it("types the config as readBuildOutput resolves it, manifest complete", () => {
	expectTypeOf<Awaited<ReturnType<typeof recordBuild>>["config"]>().toEqualTypeOf<ResolvedOutputWorkerConfig>();
});

it("refuses a Worker name the Build Output doesn't contain", async () => {
	await expect(recordBuild(project, { worker: "missing" })).rejects.toThrow(
		`The Build Output in ${project} has no Worker named "missing". It has: example (default), other.`,
	);
});

it("refuses a Worker name the Build Output contains more than once, as cf deploy does", async () => {
	const root = copy();
	const configFile = join(root, ".cloudflare/output/v0/workers/other/worker.config.json");
	writeFileSync(configFile, JSON.stringify({ ...JSON.parse(readFileSync(configFile, "utf8")), name: "example" }));

	await expect(recordBuild(root, { worker: "example" })).rejects.toThrow(
		`The Build Output in ${root} contains more than one Worker named "example".`,
	);
});

it("refuses a Build Output whose Worker config doesn't match the schema", async () => {
	const root = copy();
	writeFileSync(join(root, ".cloudflare/output/v0/workers/default/worker.config.json"), JSON.stringify({ name: 1 }));

	await expect(recordBuild(root)).rejects.toThrow(BuildOutputError);
});

it("leaves a Worker's digest alone when only another Worker changes", async () => {
	const root = copy();
	writeFileSync(join(root, ".cloudflare/output/v0/workers/other/bundle/index.js"), "changed\n");

	expect((await recordBuild(root)).digest).toBe((await recordBuild(project)).digest);
	expect((await recordBuild(root, { worker: "other" })).digest).not.toBe((await recordBuild(project, { worker: "other" })).digest);
});

it("digests dotfiles too, since assets such as .well-known/ ship with the Worker", async () => {
	const root = copy();
	writeFileSync(join(root, ".cloudflare/output/v0/workers/default/assets/.well-known/security.txt"), "changed\n");

	expect((await recordBuild(root)).digest).not.toBe((await recordBuild(project)).digest);
});

const empty = () => mkdtempSync(join(tmpdir(), "build-"));

const script = (source: string) => `node -e ${JSON.stringify(source.replaceAll(/\s*\n\s*/g, " "))}`;
const buildCommand = script(
	`const fs = require("node:fs");
	fs.cpSync(${JSON.stringify(join(project, ".cloudflare"))}, ".cloudflare", { recursive: true });
	fs.writeFileSync(".cloudflare/output/v0/workers/default/assets/marker.txt", process.env.MARKER);`,
);

const buildInputs = (root: string): BuildInputs => ({
	project: root,
	command: buildCommand,
	environment: { MARKER: "from-pulumi" },
	triggers: ["source-1"],
});

it("builds the project with its environment, then records what the build produced", async () => {
	const root = empty();
	const { id, outs } = await create(buildInputs(root));

	expect(readFileSync(join(root, ".cloudflare/output/v0/workers/default/assets/marker.txt"), "utf8")).toBe("from-pulumi");
	expect(id).toBe(root);
	expect(outs).toStrictEqual({ ...buildInputs(root), record: JSON.stringify(await recordBuild(root)) });
});

it("records the named Worker when one is given", async () => {
	const root = empty();
	const { outs } = await create({ ...buildInputs(root), worker: "other" });

	expect(JSON.parse(outs!.record)).toStrictEqual(await recordBuild(root, { worker: "other" }));
});

it("reports a failed build with the end of its output", async () => {
	const command = script(`console.log("compiling"); console.error("boom"); process.exit(3);`);

	await expect(create({ ...buildInputs(empty()), command })).rejects.toThrow(
		`\`${command}\` failed with exit code 3.\ncompiling\nboom`,
	);
});

it("rebuilds when the command, environment, Worker or triggers change, and only then", async () => {
	const olds = { ...buildInputs(project), record: "{}" };
	const diffFrom = (news: BuildInputs) => diff(project, olds, news);

	expect(await diffFrom({ ...buildInputs(project), command: "true" })).toStrictEqual({ changes: true });
	expect(await diffFrom({ ...buildInputs(project), environment: { MARKER: "changed" } })).toStrictEqual({ changes: true });
	expect(await diffFrom({ ...buildInputs(project), worker: "other" })).toStrictEqual({ changes: true });
	expect(await diffFrom({ ...buildInputs(project), triggers: ["source-2"] })).toStrictEqual({ changes: true });
	expect(await diffFrom(buildInputs(project))).toStrictEqual({ changes: false });
});

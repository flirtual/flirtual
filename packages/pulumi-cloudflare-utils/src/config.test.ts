import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { ResolvedOutputWorkerConfig } from "@cloudflare/build-output-utils";
import { expect, it, vi } from "vitest";

import { bindingProblems, deployedConfig, settingsOf, splitSecrets } from "./config.ts";

const built: ResolvedOutputWorkerConfig = JSON.parse(
	readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), "fixtures/project/.cloudflare/output/v0/workers/default/worker.config.json"),
		"utf8",
	),
);

it("keeps the build's settings, leaving out every field that names a resource", () => {
	expect(settingsOf({ ...built, domains: ["example.dev"], tailConsumers: [{ worker: "tail" }] })).toStrictEqual({
		compatibilityDate: "2025-09-01",
		compatibilityFlags: [],
		workersDev: false,
		assets: { htmlHandling: "drop-trailing-slash", notFoundHandling: "none", runWorkerFirst: ["/"] },
		manifest: { type: "complete", mainModule: "index.js", modules: { "index.js": { type: "esm" } } },
	});
});

const withSecret = { ...built.env, TOKEN: { type: "secret" as const } };
const provided = {
	ASSETS: { type: "assets" },
	UPLOADS: { type: "r2", name: "uploads-production" },
	API_URL: { type: "text", value: "https://api.example" },
	TOKEN: { type: "secret", value: "token" },
};

it("finds no problem when the deployment provides exactly the build's bindings", () => {
	expect(bindingProblems(withSecret, provided)).toStrictEqual([]);
});

it("names a binding the build uses that the deployment doesn't provide", () => {
	const { UPLOADS: _, ...rest } = provided;
	expect(bindingProblems(withSecret, rest)).toStrictEqual([
		"env.UPLOADS: the build uses it, but the deployment doesn't provide it",
	]);
});

it("names a binding whose type differs from the build's", () => {
	expect(bindingProblems(withSecret, { ...provided, UPLOADS: { type: "kv" } })).toStrictEqual([
		"env.UPLOADS: the build expects type r2, but the deployment provides kv",
	]);
});

it("names a binding the build doesn't use", () => {
	expect(bindingProblems(withSecret, { ...provided, OLD: { type: "r2" } })).toStrictEqual([
		"env.OLD: the deployment provides it, but the build doesn't use it",
	]);
});

it("names a secret with no value", () => {
	expect(bindingProblems(withSecret, { ...provided, TOKEN: { type: "secret" } })).toStrictEqual([
		"env.TOKEN: the deployment provides this secret without a value",
	]);
});

it("applies the deployed config to the build's settings alone", () => {
	const config = { name: "example-production", compatibilityDate: "2025-09-01", env: provided };
	const apply = vi.fn(() => config);

	expect(deployedConfig({ ...built, env: withSecret }, apply)).toBe(config);
	expect(apply).toHaveBeenCalledWith(settingsOf(built));
});

it("refuses a deployed config whose bindings don't match the build, naming each problem", () => {
	const apply = () => ({ name: "example-production", compatibilityDate: "2025-09-01", env: { ASSETS: { type: "assets" } } });

	expect(() => deployedConfig(built, apply)).toThrow(
		[
			"The deployment's bindings don't match the build:",
			"  env.UPLOADS: the build uses it, but the deployment doesn't provide it",
			"  env.API_URL: the build uses it, but the deployment doesn't provide it",
		].join("\n"),
	);
});

it("takes secret values out of the config, leaving their bindings", () => {
	const value = { secret: true };
	const { config, secrets } = splitSecrets({ name: "example-production", env: { ...provided, TOKEN: { type: "secret", value } } });

	expect(config).toStrictEqual({ name: "example-production", env: { ...provided, TOKEN: { type: "secret" } } });
	expect(secrets).toStrictEqual({ TOKEN: value });
	expect(secrets.TOKEN).toBe(value);
});

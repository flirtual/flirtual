import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as pulumi from "@pulumi/pulumi";
import { beforeAll, expect, it, vi } from "vitest";

import { settingsOf } from "./config.ts";
import type { BuildSettings } from "./config.ts";
import { Deployment, provider } from "./deployment.ts";
import { recordBuild } from "./providers/build-output.ts";
import { cf } from "./providers/client.ts";
import type { DeploymentInputs } from "./providers/deployment.ts";

vi.mock("./providers/client.ts", () => ({ cf: vi.fn(), run: vi.fn() }));

const project = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "project");
const record = await recordBuild(project);

it("leaves the Worker alone when the deployment is deleted, since the consumer owns it", async () => {
	await expect(
		provider.delete!("example-production", {} as DeploymentInputs),
	).resolves.toBeUndefined();
	expect(cf).not.toHaveBeenCalled();
});

it("hands diffs to the provider module, which Pulumi loads by URL", async () => {
	const inputs = {
		accountId: "account",
		project,
		command: "true",
		environment: {},
		record: JSON.stringify(record),
		config: "{}",
		secrets: {},
	};

	expect(await provider.diff!("worker", inputs, inputs)).toStrictEqual({ changes: false });
	expect(await provider.diff!("worker", inputs, { ...inputs, accountId: "other" })).toStrictEqual({
		changes: true,
	});
});

const registered: Array<pulumi.runtime.MockResourceArgs> = [];

beforeAll(async () => {
	// Vitest's module rewriting can't be serialized.
	const closure = createRequire(import.meta.url)("@pulumi/pulumi/runtime/closure/serializeClosure");
	vi.spyOn(closure, "serializeFunction").mockResolvedValue({ text: "", exportName: "handler" });

	await pulumi.runtime.setMocks(
		{
			newResource: (args) => {
				registered.push(args);
				return { id: `${args.name}-id`, state: args.inputs };
			},
			call: (args) => args.inputs,
		},
		"project",
		"stack",
	);
});

it("deploys the config applied to the build's settings, with secret values split out", async () => {
	const built = {
		...record.config,
		env: { ...record.config.env, TOKEN: { type: "secret" as const } },
	};
	const apply = vi.fn((settings: BuildSettings) => ({
		...settings,
		name: pulumi.output("example-production"),
		triggers: [{ type: "queue" as const, name: pulumi.output("uploads-production") }],
		env: {
			ASSETS: { type: "assets" as const },
			UPLOADS: { type: "r2" as const, name: pulumi.output("uploads-production") },
			API_URL: { type: "text" as const, value: "https://api.example" },
			TOKEN: { type: "secret" as const, value: "token" },
		},
	}));

	const deployment = new Deployment("worker", {
		accountId: "account",
		build: {
			project: "/nonexistent/checkout",
			command: "pnpm build",
			environment: { MARKER: "from-pulumi" },
			record: pulumi.output(JSON.stringify({ ...record, config: built })),
		},
		apply,
	});
	await new Promise((resolve) => deployment.urn.apply(resolve));

	expect(apply).toHaveBeenCalledWith(settingsOf(built));

	const resource = registered.find(({ name }) => name === "worker")!;
	expect(resource.inputs.accountId).toBe("account");
	expect(resource.inputs.project).toBe("/nonexistent/checkout");
	expect(resource.inputs.command).toBe("pnpm build");
	expect(resource.inputs.environment).toStrictEqual({ MARKER: "from-pulumi" });
	expect(JSON.parse(resource.inputs.config)).toStrictEqual({
		...settingsOf(built),
		name: "example-production",
		triggers: [{ type: "queue", name: "uploads-production" }],
		env: {
			ASSETS: { type: "assets" },
			UPLOADS: { type: "r2", name: "uploads-production" },
			API_URL: { type: "text", value: "https://api.example" },
			TOKEN: { type: "secret" },
		},
	});
	expect(resource.inputs.secrets).toStrictEqual({ TOKEN: "token" });
	expect("strict" in resource.inputs).toBe(false);
});

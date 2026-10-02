import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, it } from "vitest";

import { provider } from "./build-output.ts";

const project = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "project");

it("hands diffs to the provider module, which Pulumi loads by URL", async () => {
	const inputs = { project, command: "true", environment: {}, triggers: ["source-1"] };

	expect(await provider.diff!(project, { ...inputs, record: "{}" }, inputs)).toStrictEqual({ changes: false });
	expect(await provider.diff!(project, { ...inputs, record: "{}" }, { ...inputs, triggers: ["source-2"] })).toStrictEqual({ changes: true });
});

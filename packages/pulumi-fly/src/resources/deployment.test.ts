import { afterEach, expect, it, vi } from "vitest";

const commands: Array<string> = [];

vi.mock("../client.ts", () => ({
	fly: async (templates: TemplateStringsArray, ...values: Array<string | Array<string>>) => {
		commands.push(
			templates
				.flatMap((chunk, index) => [
					chunk,
					...(index < values.length ? [values[index]!].flat() : []),
				])
				.join(" ")
				.replaceAll(/\/\S+\/fly\.json/gu, "<file>")
				.replaceAll(/\s+/gu, " ")
				.trim(),
		);
		return "";
	},
}));

vi.mock("./secret.ts", () => ({
	digests: async () => ({}),
	drifted: async () => false,
	importStaged: async () => {},
	record: async () => ({}),
	unsetStaged: async () => {},
}));

const { provider } = await import("./deployment.ts");

afterEach(() => {
	commands.length = 0;
});

const inputs = { app: "flirtual-latest-listmonk", configuration: "{}", secrets: {} };

it("deploys with Fly's spare machines by default", async () => {
	await provider.create({ ...inputs, singleMachine: false });

	expect(commands).toEqual(["deploy --config <file> --yes"]);
});

it("keeps a single-machine app to exactly one machine, including one Fly already doubled", async () => {
	await provider.create({ ...inputs, singleMachine: true });

	expect(commands).toEqual([
		"deploy --config <file> --yes --ha=false",
		"scale count 1 --app flirtual-latest-listmonk --yes",
	]);
});

it("leaves a deployment from before `singleMachine` alone when it stays off", async () => {
	const olds = { ...inputs, digests: {} } as Parameters<NonNullable<typeof provider.diff>>[1];

	expect(
		await provider.diff!("flirtual-latest-api", olds, { ...inputs, singleMachine: false }),
	).toEqual({
		changes: false,
	});
});

it("redeploys when an app becomes single-machine", async () => {
	const olds = { ...inputs, singleMachine: false, digests: {} };

	expect(
		await provider.diff!("flirtual-latest-listmonk", olds, { ...inputs, singleMachine: true }),
	).toEqual({
		changes: true,
	});
});

import { afterEach, expect, it, vi } from "vitest";

const commands: Array<string> = [];
const failures = { remaining: 0, message: "" };
const addresses: Array<{ Address: string; Type: string; Network: { Name: string } }> = [];

function record(templates: TemplateStringsArray, values: Array<string | Array<string>>) {
	const command = templates
		.flatMap((chunk, index) => [chunk, ...(index < values.length ? [values[index]!].flat() : [])])
		.join(" ")
		.replaceAll(/\s+/gu, " ")
		.trim();
	commands.push(command);
	return command;
}

vi.mock("../client.ts", () => ({
	fly: async (templates: TemplateStringsArray, ...values: Array<string | Array<string>>) => {
		record(templates, values);
		if (failures.remaining > 0) {
			failures.remaining -= 1;
			throw new Error(failures.message);
		}
		addresses.push({ Address: "fdaa:0:1::3", Type: "private_v6", Network: { Name: "stack" } });
		return "";
	},
	flyJson: async (templates: TemplateStringsArray, ...values: Array<string | Array<string>>) => {
		record(templates, values);
		return addresses;
	},
	flyDelete: async () => {},
}));

vi.useFakeTimers();

const { provider } = await import("./flycast.ts");

afterEach(() => {
	commands.length = 0;
	addresses.length = 0;
	failures.remaining = 0;
});

const allocate = "ips allocate-v6 --private --network stack --app flirtual-latest-manticore";

it("retries an allocation Fly couldn't make yet, as on a network that was just created", async () => {
	failures.remaining = 2;
	failures.message =
		"`fly ips allocate-v6` failed with exit code 1.\nError: failed to add ip to app: unable to allocate an IP address";

	const created = provider.create({ app: "flirtual-latest-manticore", network: "stack" });
	await vi.runAllTimersAsync();
	const { outs } = await created;

	expect(commands).toEqual([
		allocate,
		allocate,
		allocate,
		"ips list --app flirtual-latest-manticore",
	]);
	expect(outs).toEqual({
		app: "flirtual-latest-manticore",
		network: "stack",
		address: "fdaa:0:1::3",
	});
});

it("fails at once on any other error", async () => {
	failures.remaining = 1;
	failures.message = "`fly ips allocate-v6` failed with exit code 1.\nError: app not found";

	await expect(
		provider.create({ app: "flirtual-latest-manticore", network: "stack" }),
	).rejects.toThrow("app not found");
	expect(commands).toEqual([allocate]);
});

import { afterEach, expect, it, vi } from "vitest";

const commands: Array<string> = [];
const addresses: Array<{ Address: string; Type: string }> = [];

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
		const command = record(templates, values);
		if (command.startsWith("ips allocate-v4 --shared"))
			addresses.push({ Address: "66.241.124.1", Type: "shared_v4" });
		if (command.startsWith("ips allocate-v6 --app"))
			addresses.push({ Address: "2a09:8280:1::1", Type: "v6" });
		return "";
	},
	flyJson: async (templates: TemplateStringsArray, ...values: Array<string | Array<string>>) => {
		record(templates, values);
		return [{ Address: "fdaa:0:1::2", Type: "private_v6" }, ...addresses];
	},
	flyDelete: async (templates: TemplateStringsArray, ...values: Array<string | Array<string>>) => {
		record(templates, values);
	},
}));

const { provider } = await import("./public.ts");

afterEach(() => {
	commands.length = 0;
	addresses.length = 0;
});

it("gives an app a shared IPv4 and an IPv6 address", async () => {
	const { id, outs } = await provider.create({ app: "flirtual-latest-api" });

	expect(commands).toEqual([
		"ips list --app flirtual-latest-api",
		"ips allocate-v4 --shared --app flirtual-latest-api",
		"ips allocate-v6 --app flirtual-latest-api",
		"ips list --app flirtual-latest-api",
	]);
	expect(id).toBe("flirtual-latest-api");
	expect(outs).toEqual({
		app: "flirtual-latest-api",
		ipv4: "66.241.124.1",
		ipv6: "2a09:8280:1::1",
	});
});

it("keeps the addresses an app already has", async () => {
	addresses.push({ Address: "66.241.124.9", Type: "shared_v4" });

	const { outs } = await provider.create({ app: "flirtual-latest-api" });

	expect(commands).toEqual([
		"ips list --app flirtual-latest-api",
		"ips allocate-v6 --app flirtual-latest-api",
		"ips list --app flirtual-latest-api",
	]);
	expect(outs).toEqual({
		app: "flirtual-latest-api",
		ipv4: "66.241.124.9",
		ipv6: "2a09:8280:1::1",
	});
});

it("releases both addresses, leaving the private one", async () => {
	await provider.delete!("flirtual-latest-api", {
		app: "flirtual-latest-api",
		ipv4: "66.241.124.1",
		ipv6: "2a09:8280:1::1",
	});

	expect(commands).toEqual([
		"ips release 66.241.124.1 --app flirtual-latest-api",
		"ips release 2a09:8280:1::1 --app flirtual-latest-api",
	]);
});

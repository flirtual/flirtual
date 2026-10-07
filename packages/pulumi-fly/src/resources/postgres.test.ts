import { afterEach, expect, it, vi } from "vitest";

const commands: Array<string> = [];

function record(templates: TemplateStringsArray, values: Array<string | Array<string>>) {
	commands.push(
		templates
			.flatMap((chunk, index) => [chunk, ...(index < values.length ? [values[index]!].flat() : [])])
			.join(" ")
			.replaceAll(/\s+/gu, " ")
			.trim(),
	);
}

vi.mock("../client.ts", () => ({
	fly: async (templates: TemplateStringsArray, ...values: Array<string | Array<string>>) => {
		record(templates, values);
		return "pg create --help --network";
	},
	flyJson: async (templates: TemplateStringsArray, ...values: Array<string | Array<string>>) => {
		record(templates, values);
		return [{ id: "148e1234" }];
	},
	flyDelete: async () => {},
}));

const { provider } = await import("./postgres.ts");

afterEach(() => {
	commands.length = 0;
});

const inputs = {
	name: "flirtual-latest-postgres",
	organization: "flirtual",
	network: "flirtual-latest",
	region: "iad",
	password: "password",
	clusterSize: 1,
	volumeSize: 10,
	memory: 1024,
};

const scaleToZero =
	"machine update 148e1234 --app flirtual-latest-postgres --env FLY_SCALE_TO_ZERO=1h --autostart=true --restart on-failure --yes";

it("creates a cluster that stops after an idle hour and wakes on a connection", async () => {
	const { outs } = await provider.create(inputs);

	expect(commands).toEqual([
		"pg create --flex --name flirtual-latest-postgres --org flirtual --network flirtual-latest --region iad --password password --initial-cluster-size 1 --volume-size 10 --vm-cpu-kind shared --vm-cpus 1 --vm-memory 1024",
		"machines list --app flirtual-latest-postgres",
		scaleToZero,
	]);
	expect(outs).toEqual({ ...inputs, idleTimeout: "1h" });
});

it("updates a cluster from before scale-to-zero in place, keeping its data", async () => {
	expect(await provider.diff!("flirtual-latest-postgres", inputs, inputs)).toEqual({
		changes: true,
		replaces: [],
	});

	const { outs } = await provider.update!("flirtual-latest-postgres", inputs, inputs);

	expect(commands).toEqual(["machines list --app flirtual-latest-postgres", scaleToZero]);
	expect(outs).toEqual({ ...inputs, idleTimeout: "1h" });
});

it("leaves a cluster that already scales to zero alone", async () => {
	expect(
		await provider.diff!("flirtual-latest-postgres", { ...inputs, idleTimeout: "1h" }, inputs),
	).toEqual({ changes: false, replaces: [] });
});

it("doesn't touch the machines of a cluster that already scales to zero on update", async () => {
	const olds = { ...inputs, idleTimeout: "1h" };

	const { outs } = await provider.update!("flirtual-latest-postgres", olds, inputs);

	expect(commands).toEqual([]);
	expect(outs).toEqual({ ...inputs, idleTimeout: "1h" });
});

it("still replaces a cluster whose size changes", async () => {
	expect(
		await provider.diff!(
			"flirtual-latest-postgres",
			{ ...inputs, idleTimeout: "1h" },
			{ ...inputs, memory: 2048 },
		),
	).toEqual({ changes: true, replaces: ["memory"] });
});

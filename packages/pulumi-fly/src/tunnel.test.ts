import { EventEmitter } from "node:events";

import { afterEach, beforeEach, expect, it, vi } from "vitest";

const spawned: Array<Array<string>> = [];

vi.mock("@pulumi/pulumi", () => ({
	ResourceHook: class {
		name: string;
		callback: () => Promise<void>;
		opts?: { onDryRun?: boolean };

		constructor(name: string, callback: () => Promise<void>, opts?: { onDryRun?: boolean }) {
			this.name = name;
			this.callback = callback;
			this.opts = opts;
		}
	},
	log: { info: () => {} },
}));

vi.mock("execa", () => ({
	execa: (file: string, argumentList: Array<string>) => {
		spawned.push([file, ...argumentList]);
		return Object.assign(Promise.resolve(), { nodeChildProcess: { unref: () => {} } });
	},
}));

vi.mock("node:net", () => ({
	createConnection: (_options: unknown, connected: () => void) => {
		const socket = Object.assign(new EventEmitter(), {
			destroy: () => {},
			end: () => {},
			setTimeout: () => socket,
		});
		queueMicrotask(connected);
		return socket;
	},
}));

const { tunnel } = await import("./tunnel.ts");

type Hook = { callback: () => Promise<void> };

const open = (hooks: ReturnType<typeof tunnel>, kind: keyof ReturnType<typeof tunnel>) =>
	(hooks[kind][0] as unknown as Hook).callback();

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	spawned.length = 0;
});

it("opens the tunnel before a role or database is created, updated or deleted", () => {
	const hooks = tunnel("cluster", "flirtual-latest-postgres", { local: 15432, remote: 5432 });

	expect(Object.keys(hooks).sort()).toEqual(["beforeCreate", "beforeDelete", "beforeUpdate"]);
});

it("goes through Flycast, which starts a Postgres that scaled to zero", async () => {
	const hooks = tunnel("cluster", "flirtual-latest-postgres", { local: 15432, remote: 5432 });

	await open(hooks, "beforeCreate");

	expect(spawned).toEqual([
		[
			"fly",
			"proxy",
			"15432:5432",
			"flirtual-latest-postgres.flycast",
			"--app",
			"flirtual-latest-postgres",
		],
	]);
});

it("waits until the check it's given passes", async () => {
	const checks: Array<number> = [];
	const ready = async (port: number) => {
		checks.push(port);
		return checks.length === 3;
	};
	const hooks = tunnel(
		"cluster",
		"flirtual-latest-postgres",
		{ local: 15432, remote: 5432 },
		ready,
	);

	const opened = open(hooks, "beforeUpdate");
	await vi.runAllTimersAsync();
	await opened;

	expect(checks).toEqual([15432, 15432, 15432]);
});

it("opens one tunnel however many hooks run", async () => {
	const hooks = tunnel("cluster", "flirtual-latest-postgres", { local: 15432, remote: 5432 });

	await open(hooks, "beforeCreate");
	await open(hooks, "beforeUpdate");

	expect(spawned).toHaveLength(1);
});

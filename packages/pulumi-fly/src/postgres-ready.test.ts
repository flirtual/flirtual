import { EventEmitter } from "node:events";

import { afterEach, expect, it, vi } from "vitest";

const replies: Array<string> = [];
const sent: Array<Buffer> = [];

vi.mock("node:net", () => ({
	createConnection: (_options: unknown, connected: () => void) => {
		const socket = Object.assign(new EventEmitter(), {
			write: (data: Buffer) => {
				sent.push(data);
				queueMicrotask(() => socket.emit("data", Buffer.from(replies.shift()!)));
				return true;
			},
			destroy: () => {},
			setTimeout: () => socket,
		});
		queueMicrotask(connected);
		return socket;
	},
}));

const { postgresReady } = await import("./postgres-ready.ts");

afterEach(() => {
	replies.length = 0;
	sent.length = 0;
});

it("sends a protocol 3.0 startup for the postgres user and database", async () => {
	replies.push("R");

	await postgresReady(15432);

	expect(sent).toHaveLength(1);
	expect(sent[0]!.readInt32BE(0)).toBe(sent[0]!.length);
	expect(sent[0]!.readInt32BE(4)).toBe(196608);
	expect(sent[0]!.subarray(8).toString()).toBe("user\0postgres\0database\0postgres\0\0");
});

it("is ready once Postgres asks for authentication", async () => {
	replies.push("R");

	expect(await postgresReady(15432)).toBe(true);
});

it("isn't ready while Postgres is still starting up", async () => {
	replies.push("E");

	expect(await postgresReady(15432)).toBe(false);
});

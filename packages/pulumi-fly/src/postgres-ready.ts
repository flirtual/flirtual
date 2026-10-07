import type { Ready } from "./tunnel.ts";

const parameters = Buffer.from("user\0postgres\0database\0postgres\0\0");
const startup = Buffer.alloc(8 + parameters.length);
startup.writeInt32BE(startup.length, 0);
startup.writeInt32BE(196608, 4);
parameters.copy(startup, 8);

// Fly's proxy accepts at once; only Postgres answers a startup with R.
// https://www.postgresql.org/docs/current/protocol-flow.html
export const postgresReady: Ready = async (port) => {
	const { createConnection } = await import("node:net");

	return new Promise((resolve) => {
		const socket = createConnection({ host: "127.0.0.1", port }, () => socket.write(startup));

		socket.once("data", (data: Buffer) => {
			socket.destroy();
			resolve(data[0] === 0x52);
		});
		socket.on("error", () => resolve(false));
		socket.on("close", () => resolve(false));
		socket.setTimeout(5000, () => {
			socket.destroy();
			resolve(false);
		});
	});
};

import * as pulumi from "@pulumi/pulumi";

// Whether what's behind the tunnel answers on the local port yet.
export type Ready = (port: number) => Promise<boolean>;

const listening: Ready = async (port) => {
	const { createConnection } = await import("node:net");

	return new Promise((resolve) => {
		const socket = createConnection({ host: "127.0.0.1", port }, () => {
			socket.end();
			resolve(true);
		});

		socket.on("error", () => resolve(false));
		socket.setTimeout(1000, () => {
			socket.destroy();
			resolve(false);
		});
	});
};

export function tunnel(
	name: string,
	app: string,
	ports: { local: number; remote: number },
	ready: Ready = listening,
) {
	const { local, remote } = ports;

	const state: { opening?: Promise<void> } = {};

	const connect = async () => {
		state.opening ??= (async () => {
			const { execa } = await import("execa");

			// `.internal` lists only running machines; Flycast starts a stopped one.
			const subprocess = execa(
				"fly",
				["proxy", `${local}:${remote}`, `${app}.flycast`, "--app", app],
				{
					stdio: "ignore",
					cleanup: true,
				},
			);

			subprocess.catch(() => {});

			// Without this the child holds the event loop open and the operation never ends.
			subprocess.nodeChildProcess.unref();

			const deadline = Date.now() + 120_000;

			const wait = async (): Promise<void> => {
				if (await ready(local)) return;
				if (Date.now() > deadline) throw new Error(`No tunnel to "${app}" after 2 minutes.`);

				await new Promise((resolve) => setTimeout(resolve, 500));
				return wait();
			};

			await wait();
			pulumi.log.info(`Tunnel to ${app} open on ${local}.`);
		})();

		await state.opening;
	};

	// A preview diffs an update against the live database, but plans a create without it; on a new
	// stack the app to tunnel to doesn't exist until the operation runs.
	return {
		beforeCreate: [new pulumi.ResourceHook(`${name}-tunnel-create`, connect)],
		beforeUpdate: [new pulumi.ResourceHook(`${name}-tunnel`, connect, { onDryRun: true })],
		beforeDelete: [new pulumi.ResourceHook(`${name}-tunnel-delete`, connect)],
	};
}

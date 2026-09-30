import * as pulumi from "@pulumi/pulumi";

// No `beforeDelete`: a delete hook makes every `pulumi destroy` need --run-program.
export function tunnel(name: string, app: string, ports: { local: number; remote: number }) {
  const { local, remote } = ports;

  const state: { opening?: Promise<void> } = {};

  const connect = async () => {
    state.opening ??= (async () => {
      const { execa } = await import("execa");
      const { createConnection } = await import("node:net");

      const subprocess = execa("fly", ["proxy", `${local}:${remote}`, "--app", app], {
        stdio: "ignore",
        cleanup: true,
      });

      subprocess.catch(() => {});

      // Without this the child holds the event loop open and the operation never ends.
      subprocess.nodeChildProcess.unref();

      const reachable = () =>
        new Promise<boolean>((resolve) => {
          const socket = createConnection({ host: "127.0.0.1", port: local }, () => {
            socket.end();
            resolve(true);
          });

          socket.on("error", () => resolve(false));
          socket.setTimeout(1000, () => {
            socket.destroy();
            resolve(false);
          });
        });

      const deadline = Date.now() + 30_000;

      const wait = async (): Promise<void> => {
        if (await reachable()) return;
        if (Date.now() > deadline) throw new Error(`No tunnel to "${app}" after 30s.`);

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
  };
}

import { spawn } from "node:child_process";

import { log } from "../log";

export type Result = Record<string, number>;

const host = process.env.DD_HOST ?? "127.0.0.1";
const modelPort = Number.parseInt(process.env.DD_PORT ?? "5001");
const modelUrl = `http://${host}:${modelPort}`;

let modelReady = false;

export const isReady = (): boolean => modelReady;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Spawn the resident DeepDanbooru model server and wait until it has loaded the
// TensorFlow model. Restart if it dies.
export const startModel = async (): Promise<void> => {
	const child = spawn("python3", ["deepdanbooru_server.py"], {
		stdio: ["ignore", "inherit", "inherit"],
		env: process.env
	});

	child.on("exit", (code) => {
		modelReady = false;
		log.error({ code }, "DeepDanbooru model server exited; restarting in 5s.");
		setTimeout(() => {
			void startModel().catch((reason) =>
				log.error({ reason: String(reason) }, "DeepDanbooru restart failed.")
			);
		}, 5000);
	});

	for (let attempt = 0; attempt < 600; attempt++) {
		try {
			const response = await fetch(`${modelUrl}/health`);
			if (response.ok) {
				modelReady = true;
				log.info("DeepDanbooru model ready.");
				return;
			}
		} catch {
			// Not listening yet; keep polling.
		}

		await sleep(1000);
	}

	throw new Error("DeepDanbooru model server did not become ready in time.");
};

// Evaluate an image file, returning tag -> probability.
export const evaluate = async (imagePath: string): Promise<Result> => {
	const response = await fetch(`${modelUrl}/evaluate`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ path: imagePath })
	});

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new Error(`DeepDanbooru evaluate failed (${response.status}): ${body}`);
	}

	const data = (await response.json()) as Record<string, number>;

	// Round to 4 decimal places.
	return Object.fromEntries(
		Object.entries(data).map(([tag, probability]) => [
			tag,
			Number.parseFloat(probability.toFixed(4))
		])
	);
};

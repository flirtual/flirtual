import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

import * as scanQueue from "./api/scan-queue";
import * as images from "./api/images";
import { classify } from "./classifiers";
import { temporaryDirectory } from "./consts";
import { log } from "./log";

void (async () => {
	const execute = async (size: number) => {
		const group = randomBytes(16).toString("hex");
		const groupFile = path.resolve(temporaryDirectory, group);

		const cleanup = async (): Promise<void> =>
			fs.rm(group, { recursive: true, force: true }).catch(() => void 0);

		try {
			const imageIds = await scanQueue.list({ size });
			if (imageIds.length === 0) {
				log.info({ groupFile }, "No images to process...");

				// Wait for a minute before checking again.
				setTimeout(() => execute(size), 60 * 1000);
				return;
			}

			await fs.mkdir(groupFile, { recursive: true }).catch(() => void 0);

			// Download available images that have not been scanned yet.
			await Promise.all(imageIds.map((imageId) => images.download(groupFile, imageId)));

			const map = await classify(groupFile, imageIds);
			await scanQueue.update(Object.fromEntries(map.entries()));

			log.info({ groupFile }, `Updated ${imageIds.length} images.`);
		} catch (reason) {
			const error = reason instanceof Error ? reason.message : String(reason);
			log.error({ groupFile, reason: error }, "Failed to process images.");
		} finally {
			await cleanup();
		}

		void execute(size);
	};

	["SIGTERM", "SIGINT"].map((signal) =>
		// Gracefully exit on signals.
		process.once(signal, () => {
			process.exit(0);
		})
	);

	const size = 10;
	void execute(size);
})();

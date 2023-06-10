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
			// Remove the group's directory and all its contents.
			fs.rm(group, { recursive: true, force: true }).catch(() => void 0);

		try {
			const imageIds = await scanQueue.list({ size });
			if (imageIds.length === 0) {
				log.info({ groupFile }, "Zero queued images...");

				// Wait for a minute before checking again.
				setTimeout(() => execute(size), 60 * 1000);
				return;
			}

			log.info({ groupFile }, `Processing ${imageIds.length} images...`);
			await fs.mkdir(groupFile, { recursive: true }).catch(() => void 0);

			// Download available images that have not been scanned yet.
			const downloadedImageIds = (
				await Promise.all(
					imageIds.map(
						async (imageId) => [imageId, await images.download(groupFile, imageId)] as const
					)
				)
			)
				// Some images may fail to download, so we filter them out.
				// We also filter out images that we just cannot process.
				.filter(([, downloaded]) => downloaded)
				.map(([imageId]) => imageId);

			if (downloadedImageIds.length === 0) {
				// If no images were downloaded, we can skip the classification.
				log.warn({ groupFile }, "Zero images downloaded.");

				// Wait 10 seconds before trying again.
				setTimeout(() => execute(size), 10 * 1000);
				return;
			}

			// Classify the downloaded images.
			const map = await classify(groupFile, downloadedImageIds);
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

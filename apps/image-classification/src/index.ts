import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

import * as scanQueue from "./api/scan-queue";
import { download } from "./api/images";
import { classify } from "./classifiers";
import { batchSize, temporaryDirectory } from "./consts";
import { imageHashes } from "./hash";
import { startServer } from "./server";
import { log } from "./log";

const execute = async (size: number) => {
	const group = randomBytes(16).toString("hex");
	const groupFile = path.resolve(temporaryDirectory, group);

	const cleanup = async (): Promise<void> => {
		// Remove the group's directory and all its contents.
		log.info({ groupFile }, "Cleaning up.");
		await fs.rm(groupFile, { recursive: true, force: true });
	};

	try {
		const images = await scanQueue.list({ size });
		if (images.length === 0) {
			log.info({ groupFile }, "Zero queued images...");

			// Wait for a minute before checking again.
			setTimeout(() => execute(size), 60 * 1000);
			return;
		}

		log.info({ groupFile }, `Processing ${images.length} images...`);
		await fs.mkdir(groupFile, { recursive: true }).catch(() => void 0);

		// Download available images that have not been scanned yet.
		const downloadedImages = await Promise.all(
			images.map(
				async (image) => [image, await download(groupFile, image.file)] as const
			)
		);

		const scannableImages = downloadedImages.filter(
			(entry): entry is readonly [(typeof entry)[0], string] => Boolean(entry[1])
		);

		if (scannableImages.length === 0) {
			// If no images were downloaded, we can skip the classification.
			log.warn({ groupFile }, "Zero images downloaded.");

			// Wait 10 seconds before trying again.
			setTimeout(() => execute(size), 10 * 1000);
			return;
		}

		// Classify the downloaded images.
		const map = await classify(
			groupFile,
			scannableImages.map(([image]) => image)
		);

		// Hashing failure is non-fatal.
		const hashes = Object.fromEntries(
			(
				await Promise.all(
					scannableImages.map(async ([image, file]) => {
						const variants = await imageHashes(file);
						if (!variants.hash) {
							log.warn({ groupFile, imageId: image.id }, "Hashing failed.");
							return null;
						}
						return [image.id, variants] as const;
					})
				)
			).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
		);

		const failed = downloadedImages
			.filter(([, downloaded]) => !downloaded)
			.map(([{ id }]) => id);

		for (const [image] of scannableImages) {
			if (!map.has(image.id)) failed.push(image.id);
		}

		await scanQueue.update({
			failed,
			hashes,
			success: Object.fromEntries(map.entries())
		});

		log.info({ groupFile }, `Updated ${images.length} images.`);
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

startServer();

void execute(batchSize);

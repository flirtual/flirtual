import { createWriteStream } from "node:fs";
import path from "node:path";

import mime from "mime-types";

import { log } from "../log";
import { temporaryDirectory } from "../consts";

import { url } from ".";

export const download = async (groupFile: string, imageId: string) => {
	try {
		const response = await fetch(`https://pfpup.flirtu.al/${imageId}`);

		if (!response.ok) {
			const body = await response.json().catch(() => null);
			const error =
				(body && typeof body === "object" && "error" in body && body?.error) ||
				response.statusText;

			log.error({ groupFile, imageId, error }, `Download failed.`);
			return false;
		}

		const extension = mime.extension(
			response.headers.get("content-type") || ""
		);

		if (!extension) {
			log.warn({ groupFile, imageId }, `Unknown content type.`);
			return false;
		}

		// UploadCare does not support transforming SVG images.
		// And we expect to receive jpeg images, but they simply return the original image.
		// https://uploadcare.com/docs/cdn-operations/#limits
		if (extension === "svg") {
			log.warn({ groupFile, imageId }, `SVG images not supported.`);
			return false;
		}

		const output = path.resolve(
			temporaryDirectory,
			groupFile,
			`${imageId}.${extension}`
		);

		const buffer = Buffer.from(await response.arrayBuffer());
		createWriteStream(output).write(buffer);

		log.info({ groupFile, imageId }, `Downloaded.`);
		return true;
	} catch (reason) {
		const error = reason instanceof Error ? reason.message : String(reason);
		log.error({ groupFile, imageId, reason: error }, "Download failed.");
		return false;
	}
};

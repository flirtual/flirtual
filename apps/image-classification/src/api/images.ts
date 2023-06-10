import { createWriteStream } from "fs";
import path from "path";

import mime from "mime-types";

import { log } from "../log";
import { temporaryDirectory } from "../consts";

import { url } from ".";

export const download = async (groupFile: string, imageId: string) => {
	try {
		const response = await fetch(url(`/v1/images/${imageId}/view`, { format: "jpeg" }), {
			redirect: "follow"
		});

		const extension = mime.extension(response.headers.get("content-type") || "");
		if (!extension) {
			log.warn({ groupFile }, `Unknown content type for ${imageId}.`);
			return false;
		}

		// UploadCare does not support transforming SVG images.
		// And we expect to receive jpeg images, but they simply return the original image.
		// https://uploadcare.com/docs/cdn-operations/#limits
		if (extension === "svg") {
			log.warn({ groupFile }, `SVG images not supported.`);
			return false;
		}

		const output = path.resolve(temporaryDirectory, groupFile, `${imageId}.${extension}`);

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

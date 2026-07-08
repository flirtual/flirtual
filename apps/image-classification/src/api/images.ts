import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import mime from "mime-types";
import sharp from "sharp";

import { log } from "../log";

export const download = async (
	groupFile: string,
	url: string
): Promise<string | false> => {
	try {
		const response = await fetch(url, {
			headers: {
				accept: "image/webp"
			}
		});

		if (!response.ok) {
			const body = await response.json().catch(() => null);
			const error =
				(body && typeof body === "object" && "error" in body && body?.error) ||
				response.statusText;

			log.error({ groupFile, url, error }, `Download failed.`);
			return false;
		}

		const extension = mime.extension(
			response.headers.get("content-type") || ""
		);

		if (!extension) {
			log.warn({ groupFile, url }, `Unknown content type.`);
			return false;
		}

		if (extension === "svg") {
			log.warn({ groupFile, url }, `SVG images not supported.`);
			return false;
		}

		let buffer: Buffer = Buffer.from(await response.arrayBuffer());
		let outputExtension = extension;

		// Classifiers only support JPEG/PNG/BMP and non-animated GIF; convert to a
		// single PNG frame.
		if (!["jpeg", "png", "bmp"].includes(extension)) {
			buffer = await sharp(buffer).png().toBuffer();
			outputExtension = "png";
		}

		const output = path.resolve(
			groupFile,
			`${randomBytes(16).toString("hex")}.${outputExtension}`
		);

		await fs.writeFile(output, buffer);

		log.info({ groupFile, url }, `Downloaded.`);
		return output;
	} catch (reason) {
		const error = reason instanceof Error ? reason.message : String(reason);
		log.error({ groupFile, url, reason: error }, "Download failed.");
		return false;
	}
};

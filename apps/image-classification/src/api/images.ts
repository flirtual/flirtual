import { createWriteStream } from "fs";
import path from "path";

import mime from "mime-types";

import { log } from "../log";
import { temporaryDirectory } from "../consts";

import { url } from ".";

export const download = async (groupFile: string, imageId: string) => {
	const response = await fetch(url(`/v1/images/${imageId}/view`, { format: "jpeg" }), {
		redirect: "follow"
	});

	const extension = mime.extension(response.headers.get("content-type") || "");
	const output = path.resolve(temporaryDirectory, groupFile, `${imageId}.${extension}`);

	const buffer = Buffer.from(await response.arrayBuffer());
	createWriteStream(output).write(buffer);

	log.info({ groupFile }, `Downloaded ${imageId}.`);
};

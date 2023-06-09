import fs from "fs/promises";
import path from "path";

import * as scanQueue from "./api/scan-queue";
import * as images from "./api/images";
import { classify } from "./classifiers";
import { temporaryDirectory } from "./consts";

void (async () => {
	const { hash, data: imageIds } = await scanQueue.list();

	const group = path.resolve(temporaryDirectory, hash);
	await fs.mkdir(group, { recursive: true }).catch(() => void 0);

	await Promise.all(imageIds.map((imageId) => images.download(hash, imageId)));

	const map = await classify(hash, imageIds);
	await fs.rm(group, { recursive: true, force: true });

	const classified = Object.fromEntries(map.entries());
	console.log(await scanQueue.update(classified));
})();

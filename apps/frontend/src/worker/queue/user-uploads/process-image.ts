/* eslint-disable no-console */
import { env } from "cloudflare:workers";

import { updateVariants } from "./api";
import { bucketUploadsOrigin } from "./environment";
import { imageVariants, outputOptions, stereoTrim, storeVariant, supportedTypes } from "./variants";

export async function processImage(key: string): Promise<void> {
	const originalUrl = new URL(key, bucketUploadsOrigin).href;

	const head = await env.SOURCE_BUCKET.head(key);
	if (!head?.httpMetadata?.contentType) return;

	const type = head.httpMetadata.contentType;
	if (!supportedTypes.includes(type)) {
		console.log(`Skipping ${originalUrl} due to unsupported type ${type}`);
		return;
	}

	const externalId = crypto.randomUUID();
	const blurId = crypto.randomUUID();

	console.log(`${originalUrl} → ${JSON.stringify({ externalId, blurId, type })}`);

	const output = outputOptions(type);
	const trim = head.customMetadata?.stereo === "sbs" ? await stereoTrim(key) : undefined;

	await Promise.all(imageVariants.map((variant) => {
		console.log(`↓ ${variant.name}`);

		const destinationKey = `${variant.name === "blur" ? blurId : externalId}/${variant.name}`;
		return storeVariant(key, destinationKey, variant, { trim, output });
	}));

	await updateVariants({ originalFile: key, externalId, blurId });
}

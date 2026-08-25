/* eslint-disable no-console */
import { env } from "cloudflare:workers";

import { updateVariants } from "./api";
import { computeBlurhash } from "./blurhash";
import { bucketUploadsOrigin } from "./environment";
import { cropStereo } from "./stereo";
import { imageVariants, supportedTypes } from "./variants";

function fork(stream: ReadableStream<Uint8Array>, count: number): Array<ReadableStream<Uint8Array>> {
	if (count <= 1) return [stream];

	const [head, tail] = stream.tee();
	return [head, ...fork(tail, count - 1)];
}

export async function processImage(key: string): Promise<void> {
	const originalUrl = new URL(key, bucketUploadsOrigin).href;

	const object = await env.SOURCE_BUCKET.get(key);

	if (!object?.httpMetadata?.contentType) return;
	const { body, httpMetadata: { contentType }, customMetadata } = object;

	if (!supportedTypes.includes(contentType)) {
		console.log(`Skipping ${originalUrl} due to unsupported type ${contentType}`);
		return;
	}

	const externalId = crypto.randomUUID();
	const blurId = crypto.randomUUID();

	console.log(`${originalUrl} → ${JSON.stringify({ externalId, blurId, contentType })}`);

	const source = customMetadata?.stereo === "sbs"
		? await cropStereo(body)
		: body;

	const streams = fork(source, imageVariants.length + 1);

	const [blurhash] = await Promise.all([
		computeBlurhash(streams[0]),
		Promise.all(imageVariants.map(async ({ name, ...transform }, index) => {
			console.log(`↓ ${name}`);

			const destinationKey = `${name === "blur" ? blurId : externalId}/${name}`;

			const result = await env.IMAGES
				.input(streams[index + 1])
				.transform(transform)
				.output({ format: "image/webp", quality: 90 });

			await env.DESTINATION_BUCKET.put(destinationKey, result.image(), {
				httpMetadata: {
					contentType: result.contentType(),
					cacheControl: "public, max-age=31536000, immutable"
				}
			});
		}))
	]);

	await updateVariants({ originalFile: key, externalId, blurId, blurhash });
}

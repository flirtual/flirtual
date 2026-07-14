import { encode as encodeBlurhash } from "blurhash";
import { env } from "cloudflare:workers";

const blurhashSize = 1024;

export async function computeBlurhash(source: ReadableStream<Uint8Array>): Promise<string> {
	const output = await env.IMAGES
		.input(source)
		.transform({ fit: "cover", width: blurhashSize, height: blurhashSize })
		.output({ format: "rgba" });

	const pixels = new Uint8ClampedArray(await output.response().arrayBuffer());
	if (pixels.length !== blurhashSize * blurhashSize * 4) {
		throw new Error(`Unexpected RGBA length ${pixels.length}`);
	}

	return encodeBlurhash(pixels, blurhashSize, blurhashSize, 4, 3);
}

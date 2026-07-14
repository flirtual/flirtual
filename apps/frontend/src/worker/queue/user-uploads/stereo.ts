import { env } from "cloudflare:workers";

// Side-by-side stereo images crop to the left half, so everything downstream
// works from a single-eye source and never has to know about stereo.
export async function cropStereo(source: ReadableStream<Uint8Array>): Promise<ReadableStream<Uint8Array>> {
	const [forInfo, forCrop] = source.tee();

	const info = await env.IMAGES.info(forInfo);
	const width = "width" in info ? info.width : undefined;
	if (!width) throw new Error("Source metadata missing width");

	const result = await env.IMAGES
		.input(forCrop)
		.transform({ trim: { right: width - Math.floor(width / 2) } })
		.output({ format: "image/webp", quality: 100 });

	return result.image();
}

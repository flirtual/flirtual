import { env } from "cloudflare:workers";

export const supportedTypes = ["image/gif", "image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"];

export interface Variant {
	name: string;
	fit: NonNullable<ImageTransform["fit"]>;
	width: number;
	height: number;
	blur?: number;
}

export const imageVariants: Array<Variant> = [
	{ name: "full", fit: "scale-down", width: 1920, height: 1920 },
	{ name: "profile", fit: "cover", width: 1008, height: 1008 },
	{ name: "thumb", fit: "cover", width: 160, height: 160 },
	{ name: "icon", fit: "cover", width: 64, height: 64 },
	{ name: "blur", fit: "cover", width: 64, height: 64, blur: 10 }
];

// The Images binding can't output HEIC/HEIF, so those fall back to JPEG. Other
// types round-trip so PNG transparency and animated GIFs survive.
function outputFormat(type: string): "image/gif" | "image/jpeg" | "image/png" | "image/webp" {
	switch (type) {
		case "image/png": return "image/png";
		case "image/gif": return "image/gif";
		case "image/webp": return "image/webp";
		default: return "image/jpeg";
	}
}

export function outputOptions(type: string): ImageOutputOptions {
	const format = outputFormat(type);
	return format === "image/png" || format === "image/gif"
		? { format }
		: { format, quality: 90 };
}

// Side-by-side stereo images crop to the left half, so downstream variants only
// see one eye.
export async function stereoTrim(sourceKey: string): Promise<ImageTransform["trim"]> {
	const object = await env.SOURCE_BUCKET.get(sourceKey);
	if (!object) throw new Error(`Source ${sourceKey} not found`);

	const info = await env.IMAGES.info(object.body);
	const width = "width" in info ? info.width : undefined;
	if (!width) throw new Error(`Metadata missing width for ${sourceKey}`);

	return { right: width - Math.floor(width / 2) };
}

export async function storeVariant(
	sourceKey: string,
	destinationKey: string,
	variant: Variant,
	options: { trim?: ImageTransform["trim"]; output: ImageOutputOptions }
): Promise<void> {
	const object = await env.SOURCE_BUCKET.get(sourceKey);
	if (!object) throw new Error(`Source ${sourceKey} not found`);

	const output = await env.IMAGES
		.input(object.body)
		.transform({
			...(options.trim && { trim: options.trim }),
			fit: variant.fit,
			width: variant.width,
			height: variant.height,
			...(variant.blur !== undefined && { blur: variant.blur })
		})
		.output(options.output);

	await env.DESTINATION_BUCKET.put(destinationKey, output.image(), {
		httpMetadata: {
			contentType: output.contentType(),
			cacheControl: "public, max-age=31536000, immutable"
		}
	});
}

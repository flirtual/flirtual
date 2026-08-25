import { decode } from "blurhash";

// Decode a base83 blurhash into a data URL for use as an image placeholder.
// Returns undefined during SSR (no canvas) or for an invalid hash.
export function blurHashToDataUrl(hash: string, size = 32): string | undefined {
	if (typeof document === "undefined") return undefined;

	try {
		const pixels = decode(hash, size, size);

		const canvas = document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;

		const context = canvas.getContext("2d");
		if (!context) return undefined;

		const image = context.createImageData(size, size);
		image.data.set(pixels);
		context.putImageData(image, 0, 0);

		return canvas.toDataURL();
	}
	catch {
		return undefined;
	}
}

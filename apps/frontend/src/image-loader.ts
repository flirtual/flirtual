import { ImageLoaderProps } from "next/image";

import { clamp } from "./utilities";
import { urls } from "./urls";

export const Quality = {
	smart: "smart",
	normal: 100,
	best: 90,
	better: 75,
	lighter: 50,
	lightest: 25
} as const;

export type UploadcareQuality = keyof typeof Quality;
export type Quality = (typeof Quality)[UploadcareQuality];

export function resolveImageQuality(quality?: number): UploadcareQuality {
	if (!quality) return "smart";

	return Object.keys(Quality).reduce((previous, key) => {
		if (quality === Quality[key as UploadcareQuality]) return key;
		return previous;
	}, "smart") as UploadcareQuality;
}

interface ImageInformation {
	id: string;
	dpi: [number, number];
	width: number;
	format: string;
	height: number;
	hash: string;
}

function getImageId(source: string): string {
	return new URL(source).pathname.split("/", 2)[1];
}

export async function getImageInformation(
	source: string
): Promise<ImageInformation> {
	const url = `${urls.media(getImageId(source))}-/json/`;
	return fetch(url).then((response) =>
		response.json()
	) as Promise<ImageInformation>;
}

export type ImageOptions = Record<
	string,
	string | null | Array<string | number | null>
>;

export function serializeImageOptions(options: ImageOptions = {}): string {
	return Object.entries(options).reduce((previous, [key, value]) => {
		if (!value) return previous;
		return `${previous}-/${key}/${
			Array.isArray(value) ? value.join("/") : value
		}/`;
	}, "");
}

export function media(id: string, options: ImageOptions = {}): string {
	return `https://media.flirtu.al/${id}/${serializeImageOptions(options)}`;
}

export default function imageLoader({
	src,
	width,
	quality
}: ImageLoaderProps): string {
	const { hostname, href } = new URL(src);
	if (hostname !== "media.flirtu.al") return src;

	return `${href}${serializeImageOptions({
		format: "auto",
		resize: `${clamp(width, 16, 3000)}x`,
		quality: href.includes("quality") ? null : resolveImageQuality(quality)
	})}`;
}

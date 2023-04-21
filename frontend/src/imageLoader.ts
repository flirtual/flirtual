import { ImageLoaderProps } from "next/image";

import { clamp } from "./utilities";
import { urls } from "./urls";

export const Quality = {
	normal: 100,
	best: 90,
	better: 75,
	lighter: 50,
	lightest: 25
};

export type Quality = keyof typeof Quality;

export function resolveImageQuality(quality?: number): Quality {
	if (!quality) return "normal";

	return Object.keys(Quality).reduce((prev, key) => {
		if (quality <= Quality[key as Quality]) return key;
		return prev;
	}, "normal") as Quality;
}

interface ImageInformation {
	id: string;
	dpi: [number, number];
	width: number;
	format: string;
	height: number;
	hash: string;
}

function getImageId(src: string): string {
	return new URL(src).pathname.split("/", 2)[1];
}

export async function getImageInformation(src: string): Promise<ImageInformation> {
	const url = `${urls.media(getImageId(src))}-/json/`;
	return fetch(url).then((res) => res.json()) as Promise<ImageInformation>;
}

export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
	const { hostname, pathname } = new URL(src);

	if (hostname !== "media.flirtu.al") return src;
	const id = pathname.split("/", 2)[1];

	return `${urls.media(id)}-/format/auto/-/resize/${clamp(width, 16, 3000)}x/${
		quality && quality !== Quality.normal ? `-/quality/${resolveImageQuality(quality)}/` : ""
	}`;
}

import type { ImageLoaderProps } from "next/image";

export type ImageOptions = Record<
	string,
	Array<number | string | null> | string | null
>;

export default function imageLoader({ src }: ImageLoaderProps): string {
	return src;
}

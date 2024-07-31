import type { ImageLoaderProps } from "next/image";

export type ImageOptions = Record<
	string,
	string | null | Array<string | number | null>
>;

export default function imageLoader({ src }: ImageLoaderProps): string {
	return src;
}

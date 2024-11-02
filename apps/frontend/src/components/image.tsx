"use client";

import NextImage from "next/image";
import type { FC } from "react";

import { notFoundImage } from "~/api/user/profile/images";
import type { ImageOptions } from "~/image-loader";

export type ImageProps = {
	options?: ImageOptions;
	src: string;
} & Omit<
	Parameters<typeof NextImage>[0],
	"loader" | "quality" | "src"
>;

export const Image: FC<ImageProps> = ({ src, ...props }) => {
	return (
		<NextImage
			{...props}
			data-block
			src={src}
			onError={({ currentTarget }) => {
				// If the image fails to load (doesn't exist), use a fallback.
				currentTarget.src = notFoundImage.url;
			}}
		/>
	);
};

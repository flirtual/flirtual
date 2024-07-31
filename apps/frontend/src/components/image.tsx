"use client";

import NextImage from "next/image";

import { notFoundImage } from "~/api/user/profile/images";

import type { FC } from "react";
import type { ImageOptions } from "~/image-loader";

export type ImageProps = Omit<
	Parameters<typeof NextImage>[0],
	"loader" | "quality" | "src"
> & {
	options?: ImageOptions;
	src: string;
};

export const Image: FC<ImageProps> = ({ src, ...props }) => {
	return (
		<NextImage
			{...props}
			data-sentry-block
			src={src}
			onError={({ currentTarget }) => {
				// If the image fails to load (doesn't exist), use a fallback.
				currentTarget.src = notFoundImage.url;
			}}
		/>
	);
};

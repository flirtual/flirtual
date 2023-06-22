"use client";

import { FC } from "react";
import NextImage from "next/image";

import { ImageOptions, serializeImageOptions } from "~/image-loader";
import { notFoundImage } from "~/api/user/profile/images";

export type ImageProps = Omit<
	Parameters<typeof NextImage>[0],
	"loader" | "quality" | "src"
> & {
	options?: ImageOptions;
	src: string;
};

export const Image: FC<ImageProps> = ({ options = {}, src, ...props }) => {
	const { hostname, href } = new URL(src);

	if (hostname === "media.flirtu.al") {
		src = `${href}${serializeImageOptions(options)}`;
	}

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

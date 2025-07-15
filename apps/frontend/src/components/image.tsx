"use client";

import type { ComponentProps, FC } from "react";

import { notFoundImage } from "~/api/user/profile/images";

export type ImageProps = {
	src: string;
	priority?: boolean;
} & ComponentProps<"img">;

export const Image: FC<ImageProps> = ({ src, priority: _, ...props }) => {
	return (
		<img
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

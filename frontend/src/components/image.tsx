"use client";

import { FC } from "react";
import NextImage from "next/image";

import { urls } from "~/urls";
import { Quality } from "~/imageLoader";
import { NotOptional } from "~/utilities";

export type ImageProps = NotOptional<
	Omit<Parameters<typeof NextImage>[0], "loader" | "quality">,
	"width" | "height"
> & {
	quality?: Quality;
};

export const Image: FC<ImageProps> = (props) => {
	return (
		<NextImage
			{...props}
			quality={props.quality ? Quality[props.quality] : undefined}
			onError={({ currentTarget }) => {
				// If the image fails to load (doesn't exist), use a fallback.
				currentTarget.src = urls.media("e8212f93-af6f-4a2c-ac11-cb328bbc4aa4");
			}}
		/>
	);
};

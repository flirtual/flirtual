import { FC } from "react";
import NextImage from "next/image";

import { urls } from "~/urls";
import { ImageOptions, serializeImageOptions } from "~/imageLoader";

export type ImageProps = Omit<Parameters<typeof NextImage>[0], "loader" | "quality" | "src"> & {
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
			src={src}
			onError={({ currentTarget }) => {
				// If the image fails to load (doesn't exist), use a fallback.
				currentTarget.src = urls.media("e8212f93-af6f-4a2c-ac11-cb328bbc4aa4");
			}}
		/>
	);
};

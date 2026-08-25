import type { ComponentProps, FC } from "react";

import { notFoundImage } from "~/api/user/profile/images";

export type ImageProps = {
	src: string;
	priority?: boolean;
	placeholder?: boolean;
} & ComponentProps<"img">;

export const Image: FC<ImageProps> = ({ src, priority, placeholder, ...props }) => {
	return (
		<img
			{...props}
			fetchPriority={priority ? "high" : "low"}
			loading={priority ? "eager" : "lazy"}
			src={src}
			onError={(event) => {
				const { currentTarget } = event;

				if (placeholder)
					currentTarget.removeAttribute("src");
				else
					// If the image fails to load (doesn't exist), use a fallback.
					currentTarget.src = notFoundImage.url;

				props.onError?.(event);
			}}
		/>
	);
};

import type { ComponentProps, FC } from "react";

export type ImageProps = {
	src: string;
	priority?: boolean;
} & ComponentProps<"img">;

export const Image: FC<ImageProps> = ({ src, priority, ...props }) => {
	return (
		<img
			{...props}
			fetchPriority={priority ? "high" : "low"}
			loading={priority ? "eager" : "lazy"}
			src={src}
			onError={(event) => {
				event.currentTarget.removeAttribute("src");
				props.onError?.(event);
			}}
		/>
	);
};

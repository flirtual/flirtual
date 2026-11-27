import type { ComponentProps, FC } from "react";

export interface ImageMetadata {
	src: string;
	width: number;
	height: number;
}

export type ImageProps = {
	src: ImageMetadata | string;
	priority?: boolean;
} & Omit<ComponentProps<"img">, "src">;

export const Image: FC<ImageProps> = ({ src, priority, ...props }) => {
	const { src: source, width, height } = typeof src === "string" ? { src } : src;

	return (
		<img
			height={height}
			width={width}
			{...props}
			fetchPriority={priority ? "high" : "low"}
			loading={priority ? "eager" : "lazy"}
			src={source}
			onError={(event) => {
				event.currentTarget.removeAttribute("src");
				props.onError?.(event);
			}}
		/>
	);
};

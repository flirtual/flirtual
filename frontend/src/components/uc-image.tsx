import React from "react";

export type UCImageProps = Omit<React.ComponentProps<"img">, "src"> & { src: string };

export const UCImage: React.FC<UCImageProps> = ({ src, ...props }) => (
	// eslint-disable-next-line @next/next/no-img-element
	<img data-blink-uuid={src} {...props} suppressHydrationWarning />
);

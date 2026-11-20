import { Slot } from "@radix-ui/react-slot";
import { isValidElement } from "react";
import type { ComponentProps, FC } from "react";
import { twMerge } from "tailwind-merge";

import { useCopy } from "~/hooks/use-copy";

export type CopyClickProps = { value: string | null; asChild?: boolean } & ComponentProps<"span">;

export const CopyClick: FC<CopyClickProps> = ({
	value,
	children,
	asChild = true,
	className,
	...props
}) => {
	const copy = useCopy();

	const Component = asChild && isValidElement(children) ? Slot : "span";
	if (value === null) return children;

	return (
		<Component
			{...props}
			data-copy-click
			className={twMerge("cursor-pointer", className)}
			onClick={() => copy(value)}
		>
			{children}
		</Component>
	);
};

import { Slot } from "@radix-ui/react-slot";
import type { ComponentPropsWithoutRef, FC, PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

export type ThemedBorderProps = PropsWithChildren<
	{
		asChild?: boolean;
	} & ComponentPropsWithoutRef<"div">
>;

export const ThemedBorder: FC<ThemedBorderProps> = ({ asChild, ...props }) => {
	const Component = asChild ? Slot : "div";
	return (
		<Component
			{...props}
			className={twMerge("bg-brand-gradient p-1", props.className)}
		/>
	);
};

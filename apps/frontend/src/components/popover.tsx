import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";
import { twMerge } from "tailwind-merge";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;
const PopoverClose = PopoverPrimitive.Close;

function PopoverContent({
	ref,
	className,
	align = "center",
	sideOffset = 16,
	...props
}: { ref?: React.Ref<React.ComponentRef<typeof PopoverPrimitive.Content> | null> } & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				className={twMerge(
					"z-20 max-w-[95vw] animate-in fade-in-50 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
					className
				)}
				align={align}
				ref={ref}
				sideOffset={sideOffset}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export {
	Popover,
	PopoverAnchor,
	PopoverClose,
	PopoverContent,
	PopoverTrigger
};

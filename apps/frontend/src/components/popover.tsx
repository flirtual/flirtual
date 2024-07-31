"use client";

import { Children, type Dispatch, useRef } from "react";

import { useClickOutside } from "~/hooks/use-click-outside";

import type { ScreenBreakpoint } from "~/hooks/use-screen-breakpoint";

export interface PopoverProps {
	children: React.ReactNode;
	breakpoint?: ScreenBreakpoint;
	open: boolean;
	onOpenChange: Dispatch<boolean>;
}

export const Popover: React.FC<PopoverProps> = (props) => {
	const { children, open, onOpenChange } = props;

	const [overlayNode, contentNode] = Children.toArray(children);

	const overlayParentReference = useRef<HTMLDivElement>(null);
	useClickOutside(overlayParentReference, () => onOpenChange(false));

	return (
		<div className="relative">
			{contentNode}
			{open && (
				<div className="absolute z-10 mt-4" ref={overlayParentReference}>
					{overlayNode}
				</div>
			)}
		</div>
	);
};

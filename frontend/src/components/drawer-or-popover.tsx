"use client";

import { Children, Dispatch, useRef } from "react";

import { useClickOutside } from "~/hooks/use-click-outside";
import { ScreenBreakpoint, useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";

import { Drawer } from "./drawer";

export interface DrawerOrPopoverProps {
	children: React.ReactNode;
	breakpoint?: ScreenBreakpoint;
	visible: boolean;
	onVisibilityChange: Dispatch<boolean>;
}

export const DrawerOrPopover: React.FC<DrawerOrPopoverProps> = (props) => {
	const { breakpoint = "sm", children, visible, onVisibilityChange } = props;

	const [overlayNode, contentNode] = Children.toArray(children);

	const overlayParentRef = useRef<HTMLDivElement>(null);
	useClickOutside(overlayParentRef, () => onVisibilityChange(false));

	if (!useScreenBreakpoint(breakpoint)) {
		return (
			<>
				{contentNode}
				<Drawer visible={visible} onVisibilityChange={onVisibilityChange}>
					{overlayNode}
				</Drawer>
			</>
		);
	}

	return (
		<div className="relative">
			{contentNode}
			{visible && (
				<div className="absolute z-10 mt-4" ref={overlayParentRef}>
					{overlayNode}
				</div>
			)}
		</div>
	);
};

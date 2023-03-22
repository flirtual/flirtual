"use client";

import { Children, Dispatch } from "react";

import { ScreenBreakpoint, useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";

import { Drawer } from "./drawer";
import { Modal } from "./modal";

export interface DrawerOrModalProps {
	children: React.ReactNode;
	breakpoint?: ScreenBreakpoint;
	visible: boolean;
	onVisibilityChange: Dispatch<boolean>;
}

export const DrawerOrModal: React.FC<DrawerOrModalProps> = (props) => {
	const { breakpoint = "sm", children, visible, onVisibilityChange } = props;
	const [overlayNode, contentNode] = Children.toArray(children);

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
			<Modal visible={visible} onVisibilityChange={onVisibilityChange}>
				{overlayNode}
			</Modal>
		</div>
	);
};

"use client";

import { Children, type Dispatch } from "react";
import { twMerge } from "tailwind-merge";

import {
	type ScreenBreakpoint,
	useScreenBreakpoint
} from "~/hooks/use-screen-breakpoint";

import { Dialog, DialogContent } from "./dialog/dialog";
import { Drawer, DrawerContent } from "./drawer";

export interface DrawerOrDialogProps {
	children: React.ReactNode;
	breakpoint?: ScreenBreakpoint;
	open: boolean;
	onOpenChange?: Dispatch<boolean>;
	closable?: boolean;
	className?: string;
}

export const DrawerOrDialog: React.FC<DrawerOrDialogProps> = (props) => {
	const {
		breakpoint = "desktop",
		children,
		open,
		onOpenChange,
		closable = true,
		className
	} = props;
	// eslint-disable-next-line react/no-children-to-array
	const [overlayNode, contentNode] = Children.toArray(children);
	const drawer = !useScreenBreakpoint(breakpoint);

	return (
		<>
			{contentNode}
			{drawer
				? (
						<Drawer dismissible={closable} open={open} onOpenChange={onOpenChange}>
							<DrawerContent className={twMerge("group", className)} data-drawer="">
								{overlayNode}
							</DrawerContent>
						</Drawer>
					)
				: (
						<Dialog open={open} onOpenChange={onOpenChange}>
							<DialogContent
								className={twMerge("group", className)}
								closable={closable}
							>
								{overlayNode}
							</DialogContent>
						</Dialog>
					)}
		</>
	);
};

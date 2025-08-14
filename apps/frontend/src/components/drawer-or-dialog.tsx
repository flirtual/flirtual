import { Children } from "react";
import type { Dispatch } from "react";
import { twMerge } from "tailwind-merge";

import {

	useBreakpoint
} from "~/hooks/use-breakpoint";
import type { Breakpoint } from "~/hooks/use-breakpoint";

import { Dialog, DialogContent } from "./dialog/dialog";
import { Drawer, DrawerContent } from "./drawer";

export interface DrawerOrDialogProps {
	children: React.ReactNode;
	breakpoint?: Breakpoint;
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
	const drawer = !useBreakpoint(breakpoint);

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

import { Children, useRef } from "react";
import type { Dispatch } from "react";

import type { Breakpoint } from "~/hooks/use-breakpoint";
import { useClickOutside } from "~/hooks/use-click-outside";

export interface PopoverProps {
	children: React.ReactNode;
	breakpoint?: Breakpoint;
	open: boolean;
	onOpenChange: Dispatch<boolean>;
}

export const Popover: React.FC<PopoverProps> = (props) => {
	const { children, open, onOpenChange } = props;

	// eslint-disable-next-line react/no-children-to-array
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

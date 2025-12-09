import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";
import { twMerge } from "tailwind-merge";

import { useBreakpoint } from "~/hooks/use-breakpoint";
import { useSafeArea } from "~/hooks/use-safe-area";

let closeCurrentTooltip: (() => void) | null = null;

function Tooltip({
	children,
	open: controlledOpen,
	onOpenChange,
	openDelay = 300,
	closeDelay = 150,
	touchable = true,
	...props
}: {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	openDelay?: number;
	closeDelay?: number;
	touchable?: boolean;
} & Omit<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>, "onOpenChange" | "open">) {
	const [internalOpen, setInternalOpen] = React.useState(false);
	const openTimeoutReference = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const closeTimeoutReference = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;

	const setOpen = React.useCallback((newOpen: boolean) => {
		if (!isControlled) {
			setInternalOpen(newOpen);
		}
		onOpenChange?.(newOpen);
	}, [isControlled, onOpenChange]);

	const handleOpen = React.useCallback(() => {
		clearTimeout(closeTimeoutReference.current);
		openTimeoutReference.current = setTimeout(() => setOpen(true), openDelay);
	}, [setOpen, openDelay]);

	const handleOpenImmediate = React.useCallback(() => {
		closeCurrentTooltip?.();
		clearTimeout(closeTimeoutReference.current);
		clearTimeout(openTimeoutReference.current);
		setOpen(true);
	}, [setOpen]);

	const handleClose = React.useCallback(() => {
		clearTimeout(openTimeoutReference.current);
		closeTimeoutReference.current = setTimeout(() => setOpen(false), closeDelay);
	}, [setOpen, closeDelay]);

	const close = React.useCallback(() => {
		clearTimeout(openTimeoutReference.current);
		clearTimeout(closeTimeoutReference.current);
		setOpen(false);
	}, [setOpen]);

	React.useEffect(() => {
		if (open) {
			closeCurrentTooltip = close;
		}
		return () => {
			if (closeCurrentTooltip === close) {
				closeCurrentTooltip = null;
			}
		};
	}, [open, close]);

	React.useEffect(() => {
		return () => {
			clearTimeout(openTimeoutReference.current);
			clearTimeout(closeTimeoutReference.current);
		};
	}, []);

	const contextValue = React.useMemo(() => ({ handleOpen, handleOpenImmediate, handleClose, close, touchable }), [handleOpen, handleOpenImmediate, handleClose, close, touchable]);

	return (
		<TooltipContext value={contextValue}>
			<PopoverPrimitive.Root open={open} {...props}>
				{children}
			</PopoverPrimitive.Root>
		</TooltipContext>
	);
}

interface TooltipContextValue {
	handleOpen: () => void;
	handleOpenImmediate: () => void;
	handleClose: () => void;
	close: () => void;
	touchable: boolean;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function TooltipTrigger({ ref, onPointerEnter, onPointerLeave, onPointerDown, ...props }: { ref?: React.RefObject<React.ComponentRef<typeof PopoverPrimitive.Anchor> | null> } & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>) {
	const context = React.use(TooltipContext);

	const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

	return (
		<PopoverPrimitive.Anchor
			data-tooltip-trigger=""
			ref={ref}
			onPointerDown={(event) => {
				if (event.pointerType === "touch" && context?.touchable) {
					context?.handleOpenImmediate();
				}
				onPointerDown?.(event);
			}}
			onPointerEnter={(event) => {
				if (event.pointerType === "touch") {
					if (context?.touchable) {
						context?.handleOpenImmediate();
					}
				}
				else if (canHover) {
					context?.handleOpen();
				}
				onPointerEnter?.(event);
			}}
			onPointerLeave={(event) => {
				if (event.pointerType !== "touch" && canHover) {
					context?.handleClose();
				}
				onPointerLeave?.(event);
			}}
			{...props}
		/>
	);
}

TooltipTrigger.displayName = "TooltipTrigger";

function TooltipContent({
	ref,
	className,
	align = "center",
	side = "top",
	sideOffset = 1,
	onPointerEnter,
	onPointerLeave,
	onPointerDownOutside,
	...props
}: { ref?: React.Ref<React.ComponentRef<typeof PopoverPrimitive.Content> | null> } & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
	const context = React.use(TooltipContext);
	const safeArea = useSafeArea();
	const desktop = useBreakpoint("desktop");

	const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				className={twMerge(
					"z-20 max-w-[95vw] overflow-hidden rounded-lg bg-black-80 px-3 py-1 font-nunito text-base text-white-20 shadow-brand-1 animate-in fade-in-50 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 dark:bg-white-20 dark:text-black-80",
					className
				)}
				collisionPadding={{
					top: safeArea.top + (desktop ? 84 : 4),
					right: safeArea.right + 4,
					bottom: safeArea.bottom + (desktop ? 4 : 76),
					left: safeArea.left + 4
				}}
				align={align}
				ref={ref}
				side={side}
				sideOffset={sideOffset}
				onCloseAutoFocus={(event) => event.preventDefault()}
				onOpenAutoFocus={(event) => event.preventDefault()}
				onPointerDownOutside={(event) => {
					const target = event.target as HTMLElement;
					if (target.closest("[data-tooltip-trigger]")) {
						event.preventDefault();
						return;
					}
					context?.close();
					onPointerDownOutside?.(event);
				}}
				onPointerEnter={(event) => {
					if (event.pointerType !== "touch" && canHover) {
						context?.handleOpen();
					}
					onPointerEnter?.(event);
				}}
				onPointerLeave={(event) => {
					if (event.pointerType !== "touch" && canHover) {
						context?.handleClose();
					}
					onPointerLeave?.(event);
				}}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}

TooltipContent.displayName = "TooltipContent";

const MinimalTooltip: React.FC<
	React.PropsWithChildren<{ content: React.ReactNode }>
> = ({ children, content }) => {
	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent>{content}</TooltipContent>
		</Tooltip>
	);
};

export {
	MinimalTooltip,
	Tooltip,
	TooltipContent,
	TooltipTrigger
};

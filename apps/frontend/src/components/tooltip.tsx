import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";
import { twMerge } from "tailwind-merge";

let closeCurrentTooltip: (() => void) | null = null;

function Tooltip({
	children,
	open: controlledOpen,
	onOpenChange,
	openDelay = 300,
	closeDelay = 150,
	...props
}: {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	openDelay?: number;
	closeDelay?: number;
} & Omit<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>, "onOpenChange" | "open">) {
	const [internalOpen, setInternalOpen] = React.useState(false);
	const openTimeoutReference = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const closeTimeoutReference = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;

	const handleOpenChange = React.useCallback((newOpen: boolean) => {
		if (!isControlled) {
			setInternalOpen(newOpen);
		}
		onOpenChange?.(newOpen);
	}, [isControlled, onOpenChange]);

	const handleOpen = React.useCallback(() => {
		clearTimeout(closeTimeoutReference.current);
		openTimeoutReference.current = setTimeout(() => handleOpenChange(true), openDelay);
	}, [handleOpenChange, openDelay]);

	const handleOpenImmediate = React.useCallback(() => {
		closeCurrentTooltip?.();
		clearTimeout(closeTimeoutReference.current);
		clearTimeout(openTimeoutReference.current);
		handleOpenChange(true);
	}, [handleOpenChange]);

	const handleClose = React.useCallback(() => {
		clearTimeout(openTimeoutReference.current);
		closeTimeoutReference.current = setTimeout(() => handleOpenChange(false), closeDelay);
	}, [handleOpenChange, closeDelay]);

	const close = React.useCallback(() => handleOpenChange(false), [handleOpenChange]);

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

	const contextValue = React.useMemo(() => ({ handleOpen, handleOpenImmediate, handleClose }), [handleOpen, handleOpenImmediate, handleClose]);

	return (
		<TooltipContext value={contextValue}>
			<PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props}>
				{children}
			</PopoverPrimitive.Root>
		</TooltipContext>
	);
}

interface TooltipContextValue {
	handleOpen: () => void;
	handleOpenImmediate: () => void;
	handleClose: () => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function TooltipTrigger({ ref, onPointerEnter, onPointerLeave, onPointerDown, onClick, ...props }: { ref?: React.RefObject<React.ComponentRef<typeof PopoverPrimitive.Trigger> | null> } & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>) {
	const context = React.use(TooltipContext);

	return (
		<PopoverPrimitive.Trigger
			ref={ref}
			onClick={(event) => {
				event.preventDefault();
				onClick?.(event);
			}}
			onPointerDown={(event) => {
				if (event.pointerType === "touch") {
					context?.handleOpenImmediate();
				}
				onPointerDown?.(event);
			}}
			onPointerEnter={(event) => {
				if (event.pointerType !== "touch") {
					context?.handleOpen();
				}
				onPointerEnter?.(event);
			}}
			onPointerLeave={(event) => {
				if (event.pointerType !== "touch") {
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
	...props
}: { ref?: React.Ref<React.ComponentRef<typeof PopoverPrimitive.Content> | null> } & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
	const context = React.use(TooltipContext);

	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				className={twMerge(
					"z-[60] max-w-[95vw] overflow-hidden rounded-lg bg-black-80 px-3 py-1 font-nunito text-base text-white-20 shadow-brand-1 animate-in fade-in-50 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 dark:bg-white-20 dark:text-black-80",
					className
				)}
				align={align}
				ref={ref}
				side={side}
				sideOffset={sideOffset}
				onCloseAutoFocus={(event) => event.preventDefault()}
				onOpenAutoFocus={(event) => event.preventDefault()}
				onPointerEnter={(event) => {
					if (event.pointerType !== "touch") {
						context?.handleOpen();
					}
					onPointerEnter?.(event);
				}}
				onPointerLeave={(event) => {
					if (event.pointerType !== "touch") {
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

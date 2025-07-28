import * as React from "react";
import { twMerge } from "tailwind-merge";
import { Drawer as DrawerPrimitive } from "vaul";

function Drawer({
	shouldScaleBackground = true,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
	return (
		<DrawerPrimitive.Root
			shouldScaleBackground={shouldScaleBackground}
			{...props}
		/>
	);
}
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

function DrawerOverlay({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof DrawerPrimitive.Overlay> | null> } & React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>) {
	return (
		<DrawerPrimitive.Overlay
			className={twMerge("fixed inset-0 z-50 bg-black-80/80", className)}
			ref={reference}
			{...props}
		/>
	);
}
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

function DrawerContent({ ref: reference, className, children, ...props }: { ref?: React.Ref<React.ComponentRef<typeof DrawerPrimitive.Content> | null> } & React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>) {
	return (
		<DrawerPortal>
			<DrawerOverlay />
			<DrawerPrimitive.Content
				className={twMerge(
					"fixed inset-x-0 bottom-0 z-[100] mt-24 flex h-auto max-h-[75vh] flex-col rounded-t-3xl bg-white-30 p-4 font-nunito text-black-80 shadow-brand-1 dark:bg-black-70 dark:text-white-20",
					className
				)}
				ref={reference}
				{...props}
			>
				<div className="mx-auto mb-4 h-2 w-[100px] shrink-0 rounded-full bg-white-20 dark:bg-black-60" />
				{children}
			</DrawerPrimitive.Content>
		</DrawerPortal>
	);
}
DrawerContent.displayName = "DrawerContent";

function DrawerHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={twMerge(
				"grid gap-1.5 p-4 text-center desktop:text-left",
				className
			)}
			{...props}
		/>
	);
}
DrawerHeader.displayName = "DrawerHeader";

function DrawerFooter({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={twMerge("mt-auto flex flex-col gap-2 p-4", className)}
			{...props}
		/>
	);
}
DrawerFooter.displayName = "DrawerFooter";

function DrawerTitle({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof DrawerPrimitive.Title> | null> } & React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>) {
	return (
		<DrawerPrimitive.Title
			className={twMerge(
				"text-lg font-semibold leading-none tracking-tight",
				className
			)}
			ref={reference}
			{...props}
		/>
	);
}
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

function DrawerDescription({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof DrawerPrimitive.Description> | null> } & React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>) {
	return (
		<DrawerPrimitive.Description
			className={twMerge("text-sm opacity-75", className)}
			ref={reference}
			{...props}
		/>
	);
}
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	DrawerPortal,
	DrawerTitle,
	DrawerTrigger
};

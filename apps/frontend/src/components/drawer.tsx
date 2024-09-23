"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { twMerge } from "tailwind-merge";

const Drawer = ({
	shouldScaleBackground = true,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
	<DrawerPrimitive.Root
		shouldScaleBackground={shouldScaleBackground}
		{...props}
	/>
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, reference) => (
	<DrawerPrimitive.Overlay
		className={twMerge("fixed inset-0 z-50 bg-black-80/80", className)}
		ref={reference}
		{...props}
	/>
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, reference) => (
	<DrawerPortal>
		<DrawerOverlay />
		<DrawerPrimitive.Content
			ref={reference}
			className={twMerge(
				"fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-3xl bg-white-30 p-4 font-nunito text-black-80 shadow-brand-1 dark:bg-black-70 dark:text-white-20",
				className
			)}
			{...props}
		>
			<div className="mx-auto mb-4 h-2 w-[100px] rounded-full bg-white-20 dark:bg-black-60" />
			{children}
		</DrawerPrimitive.Content>
	</DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={twMerge(
			"grid gap-1.5 p-4 text-center desktop:text-left",
			className
		)}
		{...props}
	/>
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={twMerge("mt-auto flex flex-col gap-2 p-4", className)}
		{...props}
	/>
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, reference) => (
	<DrawerPrimitive.Title
		ref={reference}
		className={twMerge(
			"text-lg font-semibold leading-none tracking-tight",
			className
		)}
		{...props}
	/>
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, reference) => (
	<DrawerPrimitive.Description
		className={twMerge("text-muted-foreground text-sm", className)}
		ref={reference}
		{...props}
	/>
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
	Drawer,
	DrawerPortal,
	DrawerOverlay,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription
};

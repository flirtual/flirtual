"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { twMerge } from "tailwind-merge";

import { ThemedBorder } from "../themed-border";

import {
	dialogContentClassName,
	dialogContentInnerClassName,
	dialogDescriptionClassName,
	dialogOverlayClassName,
	dialogTitleClassName
} from ".";

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, reference) => (
	<AlertDialogPrimitive.Overlay
		className={twMerge(dialogOverlayClassName, className)}
		{...props}
		ref={reference}
	/>
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, children, ...props }, reference) => (
	<AlertDialogPortal>
		<AlertDialogOverlay />
		<ThemedBorder asChild>
			<AlertDialogPrimitive.Content
				className={twMerge(dialogContentClassName, className)}
				ref={reference}
				{...props}
			>
				<div className={dialogContentInnerClassName}>{children}</div>
			</AlertDialogPrimitive.Content>
		</ThemedBorder>
	</AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={twMerge(
			"flex flex-col gap-2 text-center sm:text-left",
			className
		)}
		{...props}
	/>
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogTitle = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, reference) => (
	<AlertDialogPrimitive.Title
		className={twMerge(dialogTitleClassName, className)}
		ref={reference}
		{...props}
	/>
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, reference) => (
	<AlertDialogPrimitive.Description
		className={twMerge(dialogDescriptionClassName, className)}
		ref={reference}
		{...props}
	/>
));
AlertDialogDescription.displayName =
	AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Action>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, reference) => (
	<AlertDialogPrimitive.Action
		className={className}
		ref={reference}
		{...props}
	/>
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, reference) => (
	<AlertDialogPrimitive.Cancel
		className={twMerge("mt-2 sm:mt-0", className)}
		ref={reference}
		{...props}
	/>
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel
};

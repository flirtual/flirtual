"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as React from "react";
import { twMerge } from "tailwind-merge";

import {
	dialogContentClassName,
	dialogContentInnerClassName,
	dialogDescriptionClassName,
	dialogOverlayClassName,
	dialogTitleClassName
} from ".";
import { ThemedBorder } from "../themed-border";

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

function AlertDialogOverlay({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Overlay> | null> } & React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>) {
	return (
		<AlertDialogPrimitive.Overlay
			className={twMerge(dialogOverlayClassName, className)}
			{...props}
			ref={reference}
		/>
	);
}
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

function AlertDialogContent({ ref: reference, className, children, ...props }: { ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Content> | null> } & React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) {
	return (
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
	);
}
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

function AlertDialogHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={twMerge(
				"flex flex-col gap-2 text-center desktop:text-left",
				className
			)}
			{...props}
		/>
	);
}
AlertDialogHeader.displayName = "AlertDialogHeader";

function AlertDialogTitle({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Title> | null> } & React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) {
	return (
		<AlertDialogPrimitive.Title
			className={twMerge(dialogTitleClassName, className)}
			ref={reference}
			{...props}
		/>
	);
}
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

function AlertDialogDescription({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Description> | null> } & React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) {
	return (
		<AlertDialogPrimitive.Description
			className={twMerge(dialogDescriptionClassName, className)}
			ref={reference}
			{...props}
		/>
	);
}
AlertDialogDescription.displayName
	= AlertDialogPrimitive.Description.displayName;

function AlertDialogAction({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Action> | null> } & React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>) {
	return (
		<AlertDialogPrimitive.Action
			className={className}
			ref={reference}
			{...props}
		/>
	);
}
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

function AlertDialogCancel({ ref: reference, ...props }: { ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Cancel> | null> } & React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>) {
	return <AlertDialogPrimitive.Cancel ref={reference} {...props} />;
}
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
};

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { ThemedBorder } from "../themed-border";

import {
	dialogContentClassName,
	dialogContentInnerClassName,
	dialogDescriptionClassName,
	dialogOverlayClassName,
	dialogTitleClassName
} from ".";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, reference) => (
	<DialogPrimitive.Overlay
		className={twMerge(dialogOverlayClassName, className)}
		ref={reference}
		{...props}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, reference) => (
	<DialogPortal>
		<DialogOverlay />
		<ThemedBorder asChild>
			<DialogPrimitive.Content
				className={twMerge(dialogContentClassName, className)}
				ref={reference}
				{...props}
			>
				<div className={dialogContentInnerClassName}>{children}</div>
				<DialogPrimitive.Close className="absolute right-5 top-5 rounded-sm text-white-10 opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none dark:text-white-20">
					<X className="h-5 w-5" />
					<span className="sr-only">Close</span>
				</DialogPrimitive.Close>
			</DialogPrimitive.Content>
		</ThemedBorder>
	</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={twMerge(
			"-mx-6 -my-4 mb-0 flex -translate-y-1 flex-col gap-2 rounded-t-3xl bg-brand-gradient px-6 py-4 text-center text-white-20 sm:text-left",
			className
		)}
		{...props}
	/>
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={twMerge("flex sm:justify-end sm:gap-2", className)}
		{...props}
	/>
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, reference) => (
	<DialogPrimitive.Title
		className={twMerge(dialogTitleClassName, className)}
		ref={reference}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, reference) => (
	<DialogPrimitive.Description
		className={twMerge(dialogDescriptionClassName, className)}
		ref={reference}
		{...props}
	/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription
};

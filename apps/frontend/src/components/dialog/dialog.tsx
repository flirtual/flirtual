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
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		closable?: boolean;
		border?: boolean;
	}
>(
	(
		{ className, children, closable = true, border = true, ...props },
		reference
	) => {
		let content = (
			<DialogPrimitive.Content
				aria-describedby={undefined}
				className={twMerge(dialogContentClassName, className)}
				ref={reference}
				{...props}
			>
				{children}
				{closable && (
					<DialogPrimitive.Close className="absolute right-5 top-4 rounded-sm text-white-10 opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none dark:text-white-20">
						<X className="size-5" />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		);
		if (border) {
			content = <ThemedBorder asChild>{content}</ThemedBorder>;
		}
		return (
			<DialogPortal>
				<DialogOverlay>{content}</DialogOverlay>
			</DialogPortal>
		);
	}
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={twMerge(
			"flex h-12 flex-col gap-2 rounded-t-3xl bg-brand-gradient px-6 py-2 text-center text-white-20 group-data-[drawer]:bg-none group-data-[drawer]:p-2 group-data-[drawer]:text-left group-data-[drawer]:text-inherit desktop:text-left",
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
		className={twMerge(
			"flex flex-row-reverse justify-end gap-2 desktop:flex-row",
			className
		)}
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

const DialogBody = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={twMerge(
			dialogContentInnerClassName,
			"group-data-[drawer]:overflow-visible group-data-[drawer]:rounded-none group-data-[drawer]:p-0 group-data-[drawer]:shadow-none",
			className
		)}
		{...props}
	/>
);
DialogBody.displayName = "DialogBody";

export {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
	DialogBody
};

"use client";

import { twMerge } from "tailwind-merge";
import { X, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { SelectItemText } from "@radix-ui/react-select";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { useTranslations } from "next-intl";

import type { Dispatch, FC } from "react";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, reference) => (
	<SelectPrimitive.Trigger
		asChild
		ref={reference}
		className={twMerge(
			"focusable flex h-11 w-full items-center gap-4 overflow-hidden rounded-xl bg-white-40 text-black-80 shadow-brand-1 data-[state=open]:focused disabled:cursor-not-allowed disabled:opacity-50 vision:bg-white-40/70 dark:bg-black-60 dark:text-white-20",
			className
		)}
		{...props}
	>
		<div className="relative cursor-pointer" tabIndex={0}>
			<SelectPrimitive.Icon className="flex aspect-square h-full shrink-0 items-center justify-center bg-brand-gradient p-2">
				<ChevronsUpDown className="size-6 text-white-20" />
			</SelectPrimitive.Icon>
			{children}
		</div>
	</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, reference) => (
	<SelectPrimitive.ScrollUpButton
		ref={reference}
		className={twMerge(
			"absolute inset-x-0 top-0 z-10 flex h-7 cursor-default items-center justify-center bg-gradient-to-b from-black-90/5 to-transparent py-1",
			className
		)}
		{...props}
	>
		<ChevronUp className="size-4 text-black-90 dark:text-white-10" />
	</SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, reference) => (
	<SelectPrimitive.ScrollDownButton
		ref={reference}
		className={twMerge(
			"absolute inset-x-0 bottom-0 z-10 flex h-7 cursor-default items-center justify-center bg-gradient-to-t from-black-90/5 to-transparent py-1",
			className
		)}
		{...props}
	>
		<ChevronDown className="size-4 text-black-90 dark:text-white-10" />
	</SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
	SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
		rows?: number;
	}
>((props, reference) => {
	const {
		className,
		children,
		position = "popper",
		// rows = 8,
		sideOffset = 8,
		...elementProps
	} = props;

	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				position={position}
				ref={reference}
				sideOffset={sideOffset}
				className={twMerge(
					"focusable-within relative z-50 max-h-[min(var(--radix-select-content-available-height),theme(spacing.96))] min-w-32 overflow-hidden rounded-xl bg-white-20 font-nunito shadow-brand-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-black-60",
					position === "popper" &&
						"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
					className
				)}
				{...elementProps}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport
					style={{
						height: "var(--radix-select-trigger-height)",
						width: "var(--radix-select-trigger-width)"
					}}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, reference) => (
	<SelectPrimitive.Label
		className={twMerge("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
		ref={reference}
		{...props}
	/>
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, reference) => (
	<SelectPrimitive.Item
		ref={reference}
		className={twMerge(
			"relative flex w-full cursor-pointer select-none items-center px-4 py-2 text-left font-nunito text-black-70 focus:outline-none data-[disabled]:pointer-events-none data-[state=checked]:bg-brand-gradient data-[state=checked]:text-white-10 data-[disabled]:opacity-50 hocus:bg-white-40 hocus:outline-none dark:text-white-20 dark:hocus:bg-black-80/50 dark:hocus:text-white-20",
			className
		)}
		{...props}
	>
		{children}
	</SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, reference) => (
	<SelectPrimitive.Separator
		className={twMerge("-mx-1 my-1 h-px bg-black-60", className)}
		ref={reference}
		{...props}
	/>
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator
};

export interface InputSelectOption {
	id: string;
	name: string;
	disabled?: boolean;
}

export interface InputSelectProps<T> {
	optional?: boolean;
	placeholder?: string;
	value: T;
	onChange: Dispatch<T>;
	options: Array<InputSelectOption>;
	Item?: FC<{ value: NonNullable<T> }>;
	className?: string;
}

export function InputSelect<K>(props: InputSelectProps<K>) {
	const t = useTranslations("inputs.select");

	const {
		value,
		placeholder = t("placeholder"),
		optional = false,
		options = [],
		className
	} = props;

	const activeOption = options.find((option) => option.id === value);

	function onChange(value: string) {
		if (optional && value === "") props.onChange(null as K);
		else props.onChange(value as K);
	}

	const Item = props.Item || SelectItem;

	return (
		<Select value={(value || "") as string} onValueChange={onChange}>
			<SelectTrigger className={className}>
				<span
					className={twMerge(
						"truncate",
						!activeOption && "text-black-30 dark:text-white-50",
						optional && props.value && "mr-8"
					)}
				>
					{activeOption?.name || placeholder}
				</span>
				{optional && props.value && (
					<button
						className="focusable pointer-events-auto absolute right-4 rounded-full brightness-90 hocus:brightness-100"
						tabIndex={0}
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							onChange("");
						}}
					>
						<X className="size-5" />
					</button>
				)}
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<Item
						disabled={option.disabled}
						key={option.id}
						value={option.id as K & string}
					>
						<SelectItemText>{option.name}</SelectItemText>
					</Item>
				))}
			</SelectContent>
		</Select>
	);
}

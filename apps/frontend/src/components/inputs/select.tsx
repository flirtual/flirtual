import { SelectItemText } from "@radix-ui/react-select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, ChevronsUpDown, ChevronUp, X } from "lucide-react";
import * as React from "react";
import type { Dispatch, FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { emptyArray } from "~/utilities";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ ref: reference, className, children, Icon = ChevronsUpDown, ...props }: {
	Icon?: FC<React.ComponentProps<"svg">>;
} & { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Trigger> | null> } & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) {
	return (
		<SelectPrimitive.Trigger
			asChild
			className={twMerge(
				"focusable flex h-11 w-full items-center gap-4 overflow-hidden rounded-xl bg-white-40 text-black-80 shadow-brand-1 data-[state=open]:focused disabled:cursor-not-allowed disabled:opacity-50 vision:bg-white-40/70 dark:bg-black-60 dark:text-white-20",
				className
			)}
			ref={reference}
			{...props}
		>
			<div className="relative cursor-pointer" tabIndex={0}>
				<SelectPrimitive.Icon className="flex aspect-square h-full shrink-0 items-center justify-center bg-brand-gradient p-2">
					<Icon className="size-6 text-white-20" />
				</SelectPrimitive.Icon>
				{children}
			</div>
		</SelectPrimitive.Trigger>
	);
}
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

function SelectScrollUpButton({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.ScrollUpButton> | null> } & React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>) {
	return (
		<SelectPrimitive.ScrollUpButton
			className={twMerge(
				"absolute inset-x-0 top-0 z-10 flex h-7 cursor-default items-center justify-center bg-gradient-to-b from-black-90/5 to-transparent py-1",
				className
			)}
			ref={reference}
			{...props}
		>
			<ChevronUp className="size-4 text-black-90 dark:text-white-10" />
		</SelectPrimitive.ScrollUpButton>
	);
}
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

function SelectScrollDownButton({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.ScrollDownButton> | null> } & React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>) {
	return (
		<SelectPrimitive.ScrollDownButton
			className={twMerge(
				"absolute inset-x-0 bottom-0 z-10 flex h-7 cursor-default items-center justify-center bg-gradient-to-t from-black-90/5 to-transparent py-1",
				className
			)}
			ref={reference}
			{...props}
		>
			<ChevronDown className="size-4 text-black-90 dark:text-white-10" />
		</SelectPrimitive.ScrollDownButton>
	);
}
SelectScrollDownButton.displayName
	= SelectPrimitive.ScrollDownButton.displayName;

function SelectContent({ ref: reference, ...props }: { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Content> | null> } & {
	rows?: number;
} & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
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
				className={twMerge(
					"focusable-within relative z-50 max-h-[min(var(--radix-select-content-available-height),theme(spacing.96))] max-w-[calc(min(var(--radix-popper-anchor-width),var(--radix-popper-available-width)))] overflow-hidden rounded-xl bg-white-20 font-nunito shadow-brand-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-black-60",
					position === "popper"
					&& "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
					className
				)}
				position={position}
				ref={reference}
				sideOffset={sideOffset}
				{...elementProps}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport
					style={{
						minHeight: "var(--radix-select-trigger-height)",
						minWidth: "var(--radix-select-trigger-width)"
					}}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}
SelectContent.displayName = SelectPrimitive.Content.displayName;

function SelectLabel({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Label> | null> } & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>) {
	return (
		<SelectPrimitive.Label
			className={twMerge("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
			ref={reference}
			{...props}
		/>
	);
}
SelectLabel.displayName = SelectPrimitive.Label.displayName;

function SelectItem({ ref: reference, className, children, ...props }: { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Item> | null> } & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
	return (
		<SelectPrimitive.Item
			className={twMerge(
				"relative flex w-full cursor-pointer items-center text-wrap px-4 py-2 text-left font-nunito text-black-70 focus:outline-none data-[disabled]:pointer-events-none data-[state=checked]:bg-brand-gradient data-[state=checked]:text-white-10 data-[disabled]:opacity-50 hocus:bg-white-40 hocus:outline-none dark:text-white-20 dark:hocus:bg-black-80/50 dark:hocus:text-white-20",
				className
			)}
			ref={reference}
			{...props}
		>
			{children}
		</SelectPrimitive.Item>
	);
}
SelectItem.displayName = SelectPrimitive.Item.displayName;

function SelectSeparator({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof SelectPrimitive.Separator> | null> } & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>) {
	return (
		<SelectPrimitive.Separator
			className={twMerge("-mx-1 my-1 h-px bg-black-60", className)}
			ref={reference}
			{...props}
		/>
	);
}
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue
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
	onItemHover?: (value: T) => void;
	options: Array<InputSelectOption>;
	Item?: FC<{ value: NonNullable<T> }>;
	className?: string;
	Icon?: FC<React.ComponentProps<"svg">>;
	tabIndex?: number;
}

export function InputSelect<K>(props: InputSelectProps<K>) {
	const { t } = useTranslation();

	const {
		value,
		// eslint-disable-next-line react/no-unstable-default-props
		placeholder = t("select_an_option"),
		optional = false,
		options = emptyArray,
		className,
		Icon,
		tabIndex
	} = props;

	const activeOption = options.find((option) => option.id === value);

	function onChange(value: string) {
		if (optional && value === "") props.onChange(null as K);
		else props.onChange(value as K);
	}

	const Item = props.Item || SelectItem;

	return (
		<Select value={(value || "") as string} onValueChange={onChange}>
			<SelectTrigger className={className} Icon={Icon} tabIndex={tabIndex}>
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
						key={option.id}
						disabled={option.disabled}
						value={option.id as K & string}
						onPointerEnter={() => props.onItemHover?.(option.id as K & string)}
					>
						<SelectItemText>{option.name}</SelectItemText>
					</Item>
				))}
			</SelectContent>
		</Select>
	);
}

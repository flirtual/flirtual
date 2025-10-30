import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import * as React from "react";
import { twMerge } from "tailwind-merge";

import { useSafeArea } from "~/hooks/use-safe-area";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

function DropdownMenuSubTrigger({ ref: reference, className, inset, children, ...props }: {
	inset?: boolean;
} & { ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger> | null> } & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>) {
	return (
		<DropdownMenuPrimitive.SubTrigger
			className={twMerge(
				"flex cursor-default items-center rounded-md px-3 py-1.5 text-sm outline-none focus:bg-white-30 data-[state=open]:bg-white-30 data-[disabled]:opacity-50 dark:focus:bg-black-50 dark:data-[state=open]:bg-black-50",
				inset && "pl-8",
				className
			)}
			ref={reference}
			{...props}
		>
			{children}
			<ChevronRight className="ml-auto size-4" />
		</DropdownMenuPrimitive.SubTrigger>
	);
}
DropdownMenuSubTrigger.displayName
	= DropdownMenuPrimitive.SubTrigger.displayName;

function DropdownMenuSubContent({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.SubContent> | null> } & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>) {
	return (
		<DropdownMenuPrimitive.SubContent
			className={twMerge(
				"z-50 min-w-40 overflow-hidden rounded-lg bg-white-10 p-2 font-nunito text-black-80 shadow-brand-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-black-60 dark:text-white-20",
				className
			)}
			ref={reference}
			{...props}
		/>
	);
}
DropdownMenuSubContent.displayName
	= DropdownMenuPrimitive.SubContent.displayName;

function DropdownMenuContent({ ref: reference, className, sideOffset = 3, ...props }: { ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.Content> | null> } & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
	const safeArea = useSafeArea();

	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				className={twMerge(
					"z-50 min-w-40 overflow-hidden rounded-lg bg-white-10 p-2 font-nunito text-black-80 shadow-brand-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-black-60 dark:text-white-20",
					className
				)}
				collisionPadding={safeArea}
				ref={reference}
				sideOffset={sideOffset}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

function DropdownMenuItem({ ref: reference, className, inset, ...props }: {
	inset?: boolean;
} & { ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.Item> | null> } & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>) {
	return (
		<DropdownMenuPrimitive.Item
			className={twMerge(
				"relative flex cursor-pointer items-center rounded-md px-3 py-1.5 text-sm outline-none transition-colors focus:bg-white-30 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-black-50",
				inset && "pl-8",
				className
			)}
			ref={reference}
			{...props}
		/>
	);
}
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

function DropdownMenuCheckboxItem({ ref: reference, className, children, checked, ...props }: { ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem> | null> } & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>) {
	return (
		<DropdownMenuPrimitive.CheckboxItem
			className={twMerge(
				"relative flex cursor-pointer items-center rounded-md px-3 py-1.5 pl-8 text-sm outline-none transition-colors focus:bg-white-30 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-black-50",
				className
			)}
			checked={checked}
			ref={reference}
			{...props}
		>
			<span className="absolute left-2 flex size-3.5 items-center justify-center">
				<DropdownMenuPrimitive.ItemIndicator>
					<Check className="size-4" />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.CheckboxItem>
	);
}
DropdownMenuCheckboxItem.displayName
	= DropdownMenuPrimitive.CheckboxItem.displayName;

function DropdownMenuRadioItem({ ref: reference, className, children, ...props }: { ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem> | null> } & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>) {
	return (
		<DropdownMenuPrimitive.RadioItem
			className={twMerge(
				"relative flex cursor-default items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className
			)}
			ref={reference}
			{...props}
		>
			<span className="absolute left-2 flex size-3.5 items-center justify-center">
				<DropdownMenuPrimitive.ItemIndicator>
					<Circle className="size-2 fill-current" />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.RadioItem>
	);
}
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

function DropdownMenuLabel({ ref: reference, className, inset, ...props }: {
	inset?: boolean;
} & { ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.Label> | null> } & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) {
	return (
		<DropdownMenuPrimitive.Label
			className={twMerge(
				"px-2 py-1.5 font-montserrat text-sm font-semibold",
				inset && "pl-8",
				className
			)}
			ref={reference}
			{...props}
		/>
	);
}
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

function DropdownMenuSeparator({ ref: reference, className, ...props }: { ref?: React.Ref<React.ComponentRef<typeof DropdownMenuPrimitive.Separator> | null> } & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator
			className={twMerge("my-1 h-0.5 bg-white-30 dark:bg-black-50", className)}
			ref={reference}
			{...props}
		/>
	);
}
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

function DropdownMenuShortcut({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			className={twMerge(
				"ml-auto text-xs tracking-widest opacity-60",
				className
			)}
			{...props}
		/>
	);
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
};

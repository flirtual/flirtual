"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

import { isInternalHref } from "~/urls";

import type { IconComponent } from "./icons";

const defaultClassName = twMerge(
	"group/button focusable flex shrink-0 items-center justify-center rounded-xl text-center font-montserrat font-semibold aria-disabled:cursor-not-allowed aria-disabled:brightness-90"
);

const sizes = {
	sm: "px-6 py-2",
	base: "py-4 px-8 text-xl"
} as const;

export type ButtonSize = false | keyof typeof sizes;

const kinds = {
	primary: "bg-brand-gradient text-white-20 shadow-brand-1",
	secondary: "bg-white-50 text-black-80 shadow-brand-1",
	tertiary: ""
};

export type ButtonKind = false | keyof typeof kinds;

export interface ButtonProps {
	size?: ButtonSize;
	kind?: ButtonKind;
	disabled?: boolean;
	Icon?: IconComponent;

	iconClassName?: string;
}

export const Button = forwardRef<
	HTMLButtonElement,
	ButtonProps & React.ComponentProps<"button">
>((props, reference) => {
	const {
		size = "base",
		kind = "primary",
		disabled,
		Icon,
		iconClassName,
		...elementProps
	} = props;

	return (
		<button
			ref={reference}
			{...elementProps}
			className={twMerge(
				defaultClassName,
				size && sizes[size],
				kind && kinds[kind],
				Icon && "flex gap-4",
				disabled && "cursor-not-allowed opacity-75",
				elementProps.className
			)}
			aria-disabled={disabled}
			disabled={disabled}
			type={elementProps.type ?? "button"}
		>
			{Icon && (
				<Icon
					className={twMerge(
						"shrink-0",
						size === "sm" ? "h-4" : "h-6",
						iconClassName
					)}
				/>
			)}
			{elementProps.children}
		</button>
	);
});

Button.displayName = "Button";

export const ButtonLink: React.FC<ButtonProps & Parameters<typeof Link>[0]> = (
	props
) => {
	const {
		size = "base",
		kind = "primary",
		disabled,
		target,
		href,
		Icon,
		iconClassName,
		...elementProps
	} = props;

	return (
		<Link
			{...elementProps}
			className={twMerge(
				defaultClassName,
				size && sizes[size],
				kind && kinds[kind],
				Icon && "flex gap-4",
				elementProps.className
			)}
			aria-disabled={disabled}
			href={href}
			target={(target ?? isInternalHref(href)) ? "_self" : "_blank"}
			onClick={(event) => {
				if (disabled) return event.preventDefault();
				if (elementProps.onClick) elementProps.onClick(event);
			}}
		>
			{Icon && (
				<Icon
					className={twMerge(
						"shrink-0",
						size === "sm" ? "h-4" : "h-6",
						iconClassName
					)}
				/>
			)}
			{elementProps.children}
		</Link>
	);
};

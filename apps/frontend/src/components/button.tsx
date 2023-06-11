"use client";

import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { IconComponent } from "./icons";

import { isInternalHref } from "~/urls";

const defaultClassName = twMerge(
	"focusable flex select-none items-center justify-center rounded-xl text-center font-montserrat font-semibold aria-disabled:cursor-not-allowed aria-disabled:brightness-90"
);

const sizes = {
	sm: "px-6 py-2",
	base: "py-4 px-8 text-xl"
} as const;

export type ButtonSize = keyof typeof sizes | false;

const kinds = {
	primary: "bg-brand-gradient text-white-20 shadow-brand-1",
	secondary: "bg-white-50 text-black-80 shadow-brand-1",
	tertiary: ""
};

export type ButtonKind = keyof typeof kinds | false;

export interface ButtonProps {
	size?: ButtonSize;
	kind?: ButtonKind;
	disabled?: boolean;
	Icon?: IconComponent;
}
export const Button: React.FC<React.ComponentProps<"button"> & ButtonProps> = (
	props
) => {
	const {
		size = "base",
		kind = "primary",
		disabled,
		Icon,
		...elementProps
	} = props;

	return (
		<button
			{...elementProps}
			aria-disabled={disabled}
			disabled={disabled}
			// eslint-disable-next-line react/button-has-type
			type={elementProps.type ?? "button"}
			className={twMerge(
				defaultClassName,
				size && sizes[size],
				kind && kinds[kind],
				Icon && "flex gap-4",
				elementProps.className
			)}
		>
			{Icon && <Icon className="h-6" />}
			{elementProps.children}
		</button>
	);
};

export const ButtonLink: React.FC<Parameters<typeof Link>[0] & ButtonProps> = (
	props
) => {
	const {
		size = "base",
		kind = "primary",
		disabled,
		Icon,
		...elementProps
	} = props;

	return (
		<Link
			{...elementProps}
			aria-disabled={disabled}
			target={props.target ?? isInternalHref(props.href) ? "_self" : "_blank"}
			className={twMerge(
				defaultClassName,
				size && sizes[size],
				kind && kinds[kind],
				Icon && "flex  gap-4",
				elementProps.className
			)}
			onClick={(event) => {
				if (disabled) return event.preventDefault();
				if (elementProps.onClick) elementProps.onClick(event);
			}}
		>
			{Icon && <Icon className="h-6" />}
			<span>{elementProps.children}</span>
		</Link>
	);
};

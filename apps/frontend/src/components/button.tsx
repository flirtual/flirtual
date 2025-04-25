"use client";

import { Loader2 } from "lucide-react";
import type { HTMLMotionProps } from "motion/react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

import type { IconComponent } from "./icons";
import type { LinkProps } from "./link";
import { Link } from "./link";

const defaultClassName = twMerge(
	"group/button focusable flex shrink-0 items-center justify-center rounded-xl text-center font-montserrat font-semibold aria-disabled:opacity-75"
);

const sizes = {
	xs: "px-3 h-8 text-xs",
	sm: "px-6 h-11",
	// base: "py-4 px-8 text-xl"
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
	pending?: boolean;
}

export function Button(props: ButtonProps & HTMLMotionProps<"button">) {
	const {
		size = "sm",
		kind = "primary",
		disabled,
		pending = false,
		Icon: _Icon,
		iconClassName: _iconClassName,
		children,
		...elementProps
	} = props;

	const Icon = pending ? Loader2 : _Icon;
	const iconClassName = pending ? "animate-spin" : _iconClassName;

	return (
		<motion.button
			{...elementProps}
			className={twMerge(
				defaultClassName,
				size && sizes[size],
				kind && kinds[kind],
				Icon && "flex gap-2",
				elementProps.className
			)}
			aria-disabled={disabled}
			disabled={disabled}
			type={elementProps.type ?? "button"}
			whileTap={{ scale: disabled ? 1 : 0.97 }}
		>
			{children as ReactNode}
			{Icon && (
				<Icon
					className={twMerge(
						"shrink-0",
						size === "sm" ? "h-4" : "h-6",
						iconClassName
					)}
				/>
			)}
		</motion.button>
	);
};

const MotionLink = motion.create(Link);

export function ButtonLink(props: ButtonProps & HTMLMotionProps<"a"> & LinkProps) {
	const {
		size = "sm",
		kind = "primary",
		disabled,
		href,
		Icon,
		iconClassName,
		children,
		...elementProps
	} = props;

	return (
		<MotionLink
			{...elementProps}
			className={twMerge(
				defaultClassName,
				size && sizes[size],
				kind && kinds[kind],
				Icon && "flex gap-2",
				elementProps.className
			)}
			aria-disabled={disabled}
			href={href}
			whileTap={{ scale: disabled ? 1 : 0.97 }}
			onClick={(event) => {
				if (disabled) return event.preventDefault();
				if (elementProps.onClick) elementProps.onClick(event);
			}}
		>
			{children as ReactNode}
			{Icon && (
				<Icon
					className={twMerge(
						"shrink-0",
						size === "sm" ? "h-4" : "h-4",
						iconClassName
					)}
				/>
			)}
		</MotionLink>
	);
};

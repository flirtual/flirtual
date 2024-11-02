"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { forwardRef, type MouseEventHandler, useState } from "react";
import { twMerge } from "tailwind-merge";

import type { IconComponent } from "../../icons";

export interface PillProps {
	Icon?: IconComponent;
	active?: boolean;
	href?: string;
	children: React.ReactNode;
	hocusable?: boolean;
	small?: boolean;
	className?: string;
	onClick?: MouseEventHandler<HTMLElement>;
}

export const Pill = forwardRef<HTMLElement, PillProps>((props, reference) => {
	const {
		Icon,
		active = false,
		hocusable = true,
		small = false,
		href,
		onClick,
		...elementProps
	} = props;
	const Element = href ? Link : onClick ? "button" : "div";

	const [hocused, setHocused] = useState(false);

	return (
		<AnimatePresence>
			<Element
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				ref={reference as any}
				{...elementProps}
				className={twMerge(
					"group pointer-events-auto relative flex h-8 items-center gap-2 rounded-xl font-montserrat text-sm font-medium shadow-brand-1 transition-all vision:!bg-white-30/70 desktop:text-base",
					(href || onClick) && "cursor-pointer",
					hocusable && (active || (hocused && (href || onClick)))
						? "bg-brand-gradient text-theme-overlay"
						: "bg-white-30 text-black-70 dark:bg-black-60 dark:text-white-20",
					small ? "px-3 py-1 text-sm" : " px-4 py-1",
					props.className
				)}
				data-active={active ? "" : undefined}
				href={href!}
				type={onClick ? "button" : undefined}
				onBlur={() => setHocused(false)}
				onClick={onClick}
				onFocus={() => hocusable && setHocused(true)}
				onPointerEnter={() => hocusable && setHocused(true)}
				onPointerLeave={() => setHocused(false)}
			>
				{Icon && <Icon className="h-4" />}
				<motion.div
					data-block
					animate={
						href && hocused ? { marginRight: "1.5rem" } : { marginRight: 0 }
					}
					className="flex items-center gap-2"
					initial={{ marginRight: 0 }}
					transition={{ type: "tween" }}
				>
					{props.children}
				</motion.div>
				{href && hocused && (
					<motion.div
						animate={{ opacity: 1 }}
						className="absolute right-0 pr-4"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						transition={{ type: "spring" }}
					>
						<Pencil className=" size-4" />
					</motion.div>
				)}
			</Element>
		</AnimatePresence>
	);
});

Pill.displayName = "Pill";

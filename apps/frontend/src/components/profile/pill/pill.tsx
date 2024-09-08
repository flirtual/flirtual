"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { forwardRef, useState, type MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";
import { Pencil } from "lucide-react";

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

export const Pill = forwardRef<HTMLElement, PillProps>((props, ref) => {
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
				ref={ref as any}
				{...elementProps}
				href={href!}
				onClick={onClick}
				data-active={active ? "" : undefined}
				type={onClick ? "button" : undefined}
				className={twMerge(
					"group pointer-events-auto relative flex h-8 select-none items-center gap-2 rounded-xl font-montserrat text-sm font-medium shadow-brand-1 transition-all vision:!bg-white-30/70 desktop:text-base",
					hocusable && "cursor-pointer",
					hocusable && (active || (hocused && (href || onClick)))
						? "bg-brand-gradient text-theme-overlay"
						: "bg-white-30 text-black-70 dark:bg-black-60 dark:text-white-20",
					small ? "px-3 py-1 text-sm" : " px-4 py-1",
					props.className
				)}
				onBlur={() => setHocused(false)}
				onFocus={() => hocusable && setHocused(true)}
				onPointerEnter={() => hocusable && setHocused(true)}
				onPointerLeave={() => setHocused(false)}
			>
				{Icon && <Icon className="h-4" />}
				<motion.div
					data-sentry-block
					className="flex items-center gap-2"
					initial={{ marginRight: 0 }}
					transition={{ type: "tween" }}
					animate={
						href && hocused ? { marginRight: "1.5rem" } : { marginRight: 0 }
					}
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

import { Pencil } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import type { MouseEventHandler, PropsWithChildren, RefAttributes } from "react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

import { Link } from "~/components/link";

import type { IconComponent } from "../../icons";

export interface PillProps extends RefAttributes<HTMLElement>, PropsWithChildren {
	Icon?: IconComponent;
	active?: boolean;
	href?: string;
	hocusable?: boolean;
	small?: boolean;
	className?: string;
	onClick?: MouseEventHandler<HTMLElement>;
}

export function Pill(props: PillProps) {
	const {
		Icon,
		active = false,
		hocusable = true,
		small = false,
		href,
		className,
		children,
		onClick,
		...elementProps
	} = props;
	const Component = href ? Link : onClick ? "button" : "div";

	const [hocused, setHocused] = useState(false);

	return (
		<AnimatePresence>
			<Component
				{...elementProps as any}
				className={twMerge(
					"group pointer-events-auto relative flex h-8 items-center gap-2 rounded-xl font-montserrat text-sm font-medium shadow-brand-1 transition-all vision:!bg-white-30/70 desktop:text-base",
					(href || onClick) && "cursor-pointer",
					hocusable && (active || (hocused && (href || onClick)))
						? "bg-brand-gradient text-theme-overlay"
						: "bg-white-30 text-black-70 dark:bg-black-60 dark:text-white-20",
					small ? "px-3 py-1 text-sm" : " px-4 py-1",
					className
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
				<m.div
					animate={
						href && hocused ? { marginRight: "1.5rem" } : { marginRight: 0 }
					}
					className="flex items-center gap-2"
					initial={{ marginRight: 0 }}
					transition={{ type: "tween" }}
				>
					{children}
				</m.div>
				{href && hocused && (
					<m.div
						animate={{ opacity: 1 }}
						className="absolute right-0 pr-4"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						transition={{ type: "spring" }}
					>
						<Pencil className=" size-4" />
					</m.div>
				)}
			</Component>
		</AnimatePresence>
	);
}

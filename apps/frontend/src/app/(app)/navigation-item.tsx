"use client";

import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";

import { useLocation } from "~/hooks/use-location";
import { toAbsoluteUrl, urlEqual } from "~/urls";

import type { ComponentProps, FC, ReactNode } from "react";

export interface NavigationalSwitchItemProps {
	href: string;
	icon: ReactNode; // FC<IconComponentProps & { gradient?: boolean }>;
	className?: string;
}

export const NavigationalSwitchItem: FC<NavigationalSwitchItemProps> = ({
	icon,
	className,
	...props
}) => {
	const location = useLocation();
	const active = urlEqual(toAbsoluteUrl(props.href), location, false);

	return (
		<Link
			{...props}
			data-active={active ? "" : undefined}
			className={twMerge(
				"group shrink-0 rounded-full p-2 transition-colors focus:outline-none data-[active]:shadow-brand-1 hocus:shadow-brand-1",
				className
			)}
		>
			<Slot
				className="aspect-square h-6 group-hocus:fill-white-20 desktop:h-8"
				//gradient={!active}
			>
				{icon}
			</Slot>
		</Link>
	);
};

export const NavigationItem: FC<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ComponentProps<"a"> & { href: string; ref?: any }
> = ({ children, ...props }) => {
	const location = useLocation();
	const active =
		toAbsoluteUrl(props.href).pathname.split("/")[1] ===
		location.pathname.split("/")[1];

	return (
		<Link
			{...props}
			className={twMerge(
				"group shrink-0 rounded-full p-2 transition-colors focus:outline-none",
				active
					? "bg-white-20 text-black-70 shadow-brand-1"
					: "hocus:bg-white-20 hocus:text-black-70 hocus:shadow-brand-1",
				props.className
			)}
		>
			{children}
		</Link>
	);
};

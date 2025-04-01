"use client";

import { Slot } from "@radix-ui/react-slot";
import type { ComponentProps, FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

import { Link } from "~/components/link";
import { useLocation } from "~/hooks/use-location";
import { toAbsoluteUrl, urlEqual } from "~/urls";

export interface NavigationalSwitchItemProps {
	href: string;
	icon: ReactNode; // FC<IconComponentProps & { gradient?: boolean }>;
	className?: string;
	strict?: boolean;
	id?: string;
}

export const NavigationalSwitchItem: FC<NavigationalSwitchItemProps> = ({
	icon,
	className,
	strict,
	...props
}) => {
	const location = useLocation();
	const active = urlEqual(toAbsoluteUrl(props.href), location, strict);

	return (
		<Link
			{...props}
			className={twMerge(
				"group shrink-0 rounded-full p-2 transition-colors focus:outline-none data-[active]:shadow-brand-1 hocus:shadow-brand-1",
				className
			)}
			data-active={active ? "" : undefined}
		>
			<Slot
				className="aspect-square h-6 group-hocus:fill-white-20 desktop:h-8"
				// gradient={!active}
			>
				{icon}
			</Slot>
		</Link>
	);
};

export const NavigationItem: FC<
	{ href: string; ref?: any } & ComponentProps<"a">
> = ({ children, ...props }) => {
	const location = useLocation();
	const active
		= toAbsoluteUrl(props.href).pathname.split("/")[1]
			=== location.pathname.split("/")[1];

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

"use client";

import { Slot } from "@radix-ui/react-slot";
import { type ComponentProps, type FC, type ReactNode, useMemo } from "react";
import { twMerge } from "tailwind-merge";

import { Link } from "~/components/link";
import { useLocation } from "~/hooks/use-location";
import { usePreferences } from "~/hooks/use-preferences";
import { toAbsoluteUrl, urlEqual } from "~/urls";

export interface NavigationalSwitchItemProps {
	href: string;
	icon: ReactNode;
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
	const active = useMemo(() => {
		location.searchParams.delete("language");
		return urlEqual(toAbsoluteUrl(props.href), location, strict);
	}, [location, props.href, strict]);

	const [rankedMode] = usePreferences("ranked_mode", false);

	return (
		<Link
			{...props}
			className={twMerge(
				"group flex shrink-0 items-center gap-2 rounded-full p-2 transition-colors focus:outline-none data-[active]:shadow-brand-1 hocus:shadow-brand-1",
				className,
				rankedMode && props.id === "date-mode-switch" && active && "!bg-[url('https://static.flirtual.com/ranked.jpg')] bg-cover bg-center"
			)}
			data-active={active ? "" : undefined}
		>
			<Slot className="group-hocus:fill-white-20 aspect-square h-6 desktop:h-8">
				{icon}
			</Slot>
			{(rankedMode && (props.id === "date-mode-switch" || props.id === "homie-mode-switch") && (
				<span className={twMerge(
					"pr-2",
					active ? "text-white-20" : "group-hocus:text-white-20 hidden text-black-70 dark:text-white-20 desktop:block"
				)}
				>
					{props.id === "date-mode-switch" ? "Ranked" : "Casual"}
				</span>
			))}
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

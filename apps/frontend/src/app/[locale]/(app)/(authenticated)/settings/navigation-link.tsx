"use client";

import { ChevronRight } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { NewBadge } from "~/components/badge";
import type { IconComponent } from "~/components/icons";
import { Link } from "~/components/link";
import { useLocation } from "~/hooks/use-location";
import { toAbsoluteUrl, urlEqual } from "~/urls";

export interface NavigationLinkProps {
	children: string;
	newBadge?: boolean;
	Icon?: IconComponent;
	href?: string;
	onClick?: () => void;
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
	Icon,
	href = null,
	onClick,
	newBadge,
	children
}) => {
	const location = useLocation();
	const active = !!href && urlEqual(toAbsoluteUrl(href), location);

	return (
		<Link
			className={twMerge(
				"flex justify-between gap-4 px-6 py-2 transition-shadow data-[external]:touch-callout-default focus:outline-none hocus:shadow-brand-inset",
				active
					? "bg-brand-gradient text-white-20 shadow-brand-inset"
					: "text-black-80 hocus:bg-brand-gradient hocus:text-white-20 vision:text-white-20 dark:text-white-20 desktop:hocus:bg-white-30 desktop:hocus:bg-none desktop:hocus:text-black-80 dark:desktop:hocus:bg-black-60 dark:desktop:hocus:text-white-20",
			)}
			as="button"
			href={href}
			type={onClick ? "button" : undefined}
			onClick={onClick}
		>
			<div className="flex gap-2">
				{Icon && <Icon className="w-6" />}
				{children}
				{newBadge && (<NewBadge small white={active} />)}
			</div>
			<ChevronRight className="w-6 shrink-0" />
		</Link>
	);
};

import { ChevronRight } from "lucide-react";
import { createPath } from "react-router";
import type { PathPattern, To } from "react-router";
import { twMerge } from "tailwind-merge";

import { NewBadge } from "~/components/badge";
import type { IconComponent } from "~/components/icons";
import { Link } from "~/components/link";
import { useMatch } from "~/i18n";

export interface NavigationLinkProps {
	children: string;
	newBadge?: boolean;
	Icon?: IconComponent;
	href?: To;
	pattern?: PathPattern;
	onClick?: () => void;
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
	Icon,
	href = null,
	pattern: _pattern,
	onClick,
	newBadge,
	children
}) => {
	const pattern = _pattern || { path: typeof href === "string" ? href : createPath(href || {}) };
	const match = useMatch(pattern);

	const active = !!href && !!match;

	return (
		<Link
			className={twMerge(
				"-mr-(--content-inset-right,0rem) -ml-(--content-inset-left,0rem) flex justify-between gap-4 py-2 pr-[calc(1.5rem+var(--content-inset-right,0rem))] pl-[calc(1.5rem+var(--content-inset-left,0rem))] transition-shadow focus:outline-hidden data-external:touch-callout-default hocus:shadow-brand-inset desktop:mx-0 desktop:px-6",
				active
					? "bg-brand-gradient text-white-20 shadow-brand-inset"
					: "text-black-80 dark:text-white-20 hocus:bg-brand-gradient hocus:text-white-20 vision:text-white-20 desktop:hocus:bg-white-30 desktop:hocus:bg-none desktop:hocus:text-black-80 dark:desktop:hocus:bg-black-60 dark:desktop:hocus:text-white-20",
			)}
			as="button"
			href={href}
			type={onClick ? "button" : undefined}
			onClick={onClick}
		>
			<div className="flex items-center gap-2">
				{Icon && <Icon className="w-6" />}
				{children}
				{newBadge && (<NewBadge small white={active} />)}
			</div>
			<ChevronRight className="w-6 shrink-0" />
		</Link>
	);
};

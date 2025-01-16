"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";

import { NewBadge } from "~/components/badge";
import type { IconComponent } from "~/components/icons";
import { Link } from "~/components/link";
import { isInternalHref, toAbsoluteUrl } from "~/urls";

export type NavigationLinkProps = {
	children: string;
	newBadge?: boolean;
	Icon?: IconComponent;
} & ({ href: string } | { onClick: () => void });

export const NavigationLink: React.FC<NavigationLinkProps> = ({
	children,
	...props
}) => {
	const pathname = usePathname();
	const Icon = props.Icon;

	return "href" in props
		? (
				<Link
					className={twMerge(
						"flex justify-between gap-4 px-6 py-2 transition-shadow focus:outline-none hocus:shadow-brand-inset",
						toAbsoluteUrl(props.href).pathname === pathname
							? "bg-brand-gradient text-white-20 shadow-brand-inset"
							: "text-black-80 hocus:bg-brand-gradient hocus:text-white-20 vision:text-white-20 dark:text-white-20 desktop:hocus:bg-white-30 desktop:hocus:bg-none desktop:hocus:text-black-80 dark:desktop:hocus:bg-black-60 dark:desktop:hocus:text-white-20",
						!isInternalHref(props.href) && "touch-callout-default"
					)}
					href={props.href}
					target={isInternalHref(props.href) ? "_self" : "_blank"}
				>
					<div className="flex gap-2">
						{Icon && <Icon className="w-6" />}
						{children}
						{"newBadge" in props && (
							<NewBadge small white={toAbsoluteUrl(props.href).pathname === pathname} />
						)}
					</div>
					<ChevronRight className="w-6 shrink-0" />
				</Link>
			)
		: (
				<button
					className="flex justify-between gap-2 px-6 py-2 text-left text-black-80 transition-shadow focus:outline-none hocus:bg-brand-gradient hocus:text-white-20 hocus:shadow-brand-inset vision:text-white-20 dark:text-white-20 desktop:hocus:bg-white-30 desktop:hocus:bg-none desktop:hocus:text-black-80 dark:desktop:hocus:bg-black-60 dark:desktop:hocus:text-white-20"
					type="button"
					onClick={props.onClick}
				>
					{Icon && <Icon className="w-6 shrink-0" />}
					<span className="w-full">{children}</span>
					<ChevronRight className="w-6 shrink-0" />
				</button>
			);
};

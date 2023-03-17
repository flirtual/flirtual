"use client";

import { ArrowTopRightOnSquareIcon, ChevronRightIcon, LinkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";

import { IconComponent } from "~/components/icons";
import { isInternalHref, toAbsoluteUrl } from "~/urls";

export type NavigationLinkProps = {
	children: string;
	Icon?: IconComponent;
} & ({ href: string } | { onClick: () => void });

export const NavigationLink: React.FC<NavigationLinkProps> = ({ children, ...props }) => {
	const pathname = usePathname();
	const Icon =
		props.Icon ||
		(!isInternalHref("href" in props ? props.href : "/") || "onClick" in props
			? ArrowTopRightOnSquareIcon
			: props.href.startsWith("/settings")
			? ChevronRightIcon
			: LinkIcon);

	return "href" in props ? (
		<Link
			href={props.href}
			className={twMerge(
				"flex justify-between gap-4 py-2 px-6 focus:outline-none hocus:shadow-brand-1",
				toAbsoluteUrl(props.href).pathname === pathname
					? "bg-brand-gradient text-white-20 shadow-brand-1"
					: "text-black-80 hocus:bg-brand-gradient hocus:text-white-20 dark:text-white-20 md:hocus:bg-white-30 md:hocus:bg-none md:hocus:text-black-80 dark:md:hocus:bg-white-20"
			)}
		>
			{children}
			<Icon className="w-6" />
		</Link>
	) : (
		<button
			className="flex justify-between gap-4 py-2 px-6 text-black-80 focus:outline-none hocus:bg-brand-gradient hocus:text-white-20 hocus:shadow-brand-1 dark:text-white-20 md:hocus:bg-white-30 md:hocus:bg-none md:hocus:text-black-80 dark:md:hocus:bg-white-20"
			type="button"
			onClick={props.onClick}
		>
			{children}
			<Icon className="w-6" />
		</button>
	);
};

"use client";

import { HomeIcon, ChatBubbleLeftRightIcon, HeartIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { twMerge } from "tailwind-merge";

import { useCurrentUser } from "~/hooks/use-current-user";

import { PeaceGradient } from "../icons/peace-gradient";
import { UserAvatar } from "../user-avatar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NavigationIconButton: React.FC<React.ComponentProps<"a"> & { href: string; ref?: any }> = ({
	children,
	...props
}) => {
	const pathname = usePathname();

	return (
		<Link
			{...props}
			className={twMerge(
				"group shrink-0 rounded-full p-2 transition-colors focus:outline-none",
				pathname === props.href
					? "bg-white-20 text-black-70 shadow-brand-1"
					: "hocus:bg-white-20 hocus:text-black-70 hocus:shadow-brand-1",
				props.className
			)}
		>
			{children}
		</Link>
	);
};

export const NavigationInner: React.FC<React.ComponentProps<"div">> = (props) => {
	const { data: user } = useCurrentUser();
	if (!user) return null;

	return (
		<div
			{...props}
			className={twMerge(
				"flex h-full w-full max-w-lg items-center justify-between gap-4 px-8 py-2 font-nunito text-white-20 md:px-16",
				props.className
			)}
		>
			<NavigationIconButton href="/">
				<HomeIcon className="h-8 w-8" />
			</NavigationIconButton>
			<NavigationIconButton href="/homies">
				<PeaceGradient className="w-8" gradient={false} />
			</NavigationIconButton>
			<NavigationIconButton href="/">
				<HeartIcon className="h-8 w-8" />
			</NavigationIconButton>
			<NavigationIconButton href="/messages">
				<div className="relative">
					<ChatBubbleLeftRightIcon className="w-8" strokeWidth={1.5} />
					<div className="absolute top-0 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gradient opacity-100 ring-[2.5px] ring-white-20 transition-all group-hocus:h-0 group-hocus:w-0 group-hocus:opacity-0">
						<span className="font-mono text-sm font-semibold leading-none text-white-20">4</span>
					</div>
				</div>
			</NavigationIconButton>
			<NavigationIconButton href={`/${user.id}`}>
				<UserAvatar className="h-8 w-8 transition-transform group-hocus:scale-125" user={user} />
			</NavigationIconButton>
		</div>
	);
};

export const Navigation: React.FC = () => {
	const { data: user } = useCurrentUser();
	if (!user) return null;

	return (
		<nav className="flex h-16 w-full sm:hidden sm:pt-0">
			<div className="fixed bottom-0 z-10 flex h-16 w-full items-center justify-center bg-brand-gradient shadow-brand-1">
				<NavigationInner />
			</div>
		</nav>
	);
};

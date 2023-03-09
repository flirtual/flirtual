"use client";

import { ChatBubbleLeftRightIcon, HeartIcon, Cog8ToothIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { twMerge } from "tailwind-merge";

import { useSessionUser } from "~/hooks/use-session";
import { useUnreadConversations } from "~/hooks/use-talkjs";
import { urls } from "~/urls";

import { UserAvatar } from "../user-avatar";

const NavigationIconButton: React.FC<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	React.ComponentProps<"a"> & { href: string; active?: (pathname: string) => boolean; ref?: any }
> = ({ children, active: isActive, ...props }) => {
	const pathname = usePathname();
	const active = isActive?.(pathname) || pathname.startsWith(props.href);

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

const ConversationListButton: React.FC = () => {
	const conversations = useUnreadConversations();

	return (
		<NavigationIconButton href={urls.conversations.list}>
			<div className="relative">
				<ChatBubbleLeftRightIcon className="w-8" strokeWidth={1.5} />
				{!!conversations.length && (
					<div className="absolute top-0 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gradient opacity-100 ring-[2.5px] ring-white-20 transition-all group-hocus:h-0 group-hocus:w-0 group-hocus:opacity-0">
						<span className="select-none font-mono text-sm font-semibold leading-none text-white-20">
							{conversations.length}
						</span>
					</div>
				)}
			</div>
		</NavigationIconButton>
	);
};

export const NavigationInner: React.FC<React.ComponentProps<"div">> = (props) => {
	const user = useSessionUser();
	if (!user) return null;

	return (
		<div
			{...props}
			className={twMerge(
				"flex h-full w-full max-w-lg items-center justify-between gap-4 py-2 px-16 font-nunito text-white-20",
				props.className
			)}
		>
			<NavigationIconButton href={urls.browse()}>
				<HeartIcon className="h-8 w-8" />
			</NavigationIconButton>
			<ConversationListButton />
			<NavigationIconButton
				active={(pathname) => pathname.startsWith(urls.settings.list())}
				href={urls.settings.list()}
			>
				<Cog8ToothIcon className="h-8 w-8" />
			</NavigationIconButton>
			<NavigationIconButton href={urls.user(user.username)}>
				<UserAvatar className="h-8 w-8 transition-transform group-hocus:scale-125" user={user} />
			</NavigationIconButton>
		</div>
	);
};

export const Navigation: React.FC = () => {
	return (
		<nav className="flex h-16 w-full sm:hidden sm:pt-0">
			<div className="fixed bottom-0 z-40 flex h-16 w-full items-center justify-center bg-brand-gradient shadow-brand-1">
				<NavigationInner />
			</div>
		</nav>
	);
};

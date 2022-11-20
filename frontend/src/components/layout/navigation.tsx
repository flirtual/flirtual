"use client";

import { HomeIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import React from "react";
import { twMerge } from "tailwind-merge";

import { useCurrentUser } from "~/hooks/use-current-user";

import { HeartGradient } from "../icons/heart-gradient";
import { PeaceGradient } from "../icons/peace-gradient";
import { UserAvatar } from "../user-avatar";

export const NavigationInner: React.FC<React.ComponentProps<"div">> = (props) => {
	const { data: user } = useCurrentUser();
	if (!user) return null;

	return (
		<div
			{...props}
			className={twMerge(
				"flex h-full w-full max-w-lg items-center justify-between gap-6 px-8 py-4 font-nunito text-brand-white md:px-16",
				props.className
			)}
		>
			<HomeIcon className="h-8 w-8 shrink-0" />
			<PeaceGradient className="w-8 shrink-0" gradient={false} />
			<HeartGradient className="w-8 shrink-0" gradient={false} />
			<div className="relative">
				<ChatBubbleLeftRightIcon className="w-9 text-white" strokeWidth={1.5} />
				<div className="absolute top-0 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient ring-[2.5px] ring-white">
					<span className="font-nunito text-sm font-semibold leading-none text-brand-white">4</span>
				</div>
			</div>
			<UserAvatar className="h-8 w-8" user={user} />
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

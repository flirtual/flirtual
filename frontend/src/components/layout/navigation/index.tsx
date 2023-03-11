"use client";

import { Cog8ToothIcon, HeartIcon } from "@heroicons/react/24/solid";
import { twMerge } from "tailwind-merge";

import { UserAvatar } from "~/components/user-avatar";
import { useSessionUser } from "~/hooks/use-session";
import { urls } from "~/urls";

import { ConversationListButton, NavigationIconButton } from "./icon-button";

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
			<NavigationIconButton href={urls.settings.list()}>
				<Cog8ToothIcon className="h-8 w-8" />
			</NavigationIconButton>
			<NavigationIconButton href={urls.user.me}>
				<UserAvatar className="h-8 w-8 transition-transform group-hocus:scale-125" user={user} />
			</NavigationIconButton>
		</div>
	);
};

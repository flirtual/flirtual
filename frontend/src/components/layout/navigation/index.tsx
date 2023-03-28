"use client";

import { HeartIcon } from "@heroicons/react/24/solid";
import { twMerge } from "tailwind-merge";

import { PeaceGradient } from "~/components/icons/peace-gradient";
import { useSessionUser } from "~/hooks/use-session";
import { urls } from "~/urls";

import { ConversationListButton, NavigationIconButton } from "./icon-button";
import { ProfileNavigation } from "./profile";

export const NavigationInner: React.FC<React.ComponentProps<"div">> = (props) => {
	const user = useSessionUser();
	if (!user) return null;

	return (
		<div
			{...props}
			className={twMerge(
				"flex h-full w-full max-w-sm items-center justify-between gap-4 py-2 px-16 font-nunito text-white-20",
				props.className
			)}
		>
			<ProfileNavigation />
			<NavigationIconButton href={urls.browse()}>
				<HeartIcon className="h-8 w-8" />
			</NavigationIconButton>
			<NavigationIconButton href={urls.browse("friend")}>
				<PeaceGradient className="h-8 w-8" gradient={false} />
			</NavigationIconButton>
			<ConversationListButton />
		</div>
	);
};

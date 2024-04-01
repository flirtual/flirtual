"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { ComponentProps, FC } from "react";
import { twMerge } from "tailwind-merge";

import { IconComponentProps } from "~/components/icons";
import { useLocation } from "~/hooks/use-location";
import { useUnreadConversations } from "~/hooks/use-talkjs";
import { toAbsoluteUrl, urlEqual, urls } from "~/urls";
import { clamp } from "~/utilities";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { HomeIcon } from "~/components/icons/gradient/home";
import { LoginIcon } from "~/components/icons/gradient/login";

import { ProfileNavigation } from "./profile";

const NavigationIconButton: FC<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ComponentProps<"a"> & { href: string; ref?: any }
> = ({ children, ...props }) => {
	const location = useLocation();
	const active =
		toAbsoluteUrl(props.href).pathname.split("/")[1] ===
		location.pathname.split("/")[1];

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

export const ConversationListButton: FC = () => {
	const conversationCount = clamp(useUnreadConversations().length, 0, 99);

	return (
		<NavigationIconButton
			href={urls.conversations.list()}
			id="conversation-button"
		>
			<div className="relative">
				<ChatBubbleLeftRightIcon
					className="aspect-square w-8"
					strokeWidth={1.5}
				/>
				{conversationCount !== 0 && (
					<div className="absolute -right-2 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gradient opacity-100 ring-[2.5px] ring-white-20 transition-all group-hocus:h-0 group-hocus:w-0 group-hocus:opacity-0">
						<span className="select-none font-mono text-sm font-semibold leading-none text-white-20">
							{conversationCount}
						</span>
					</div>
				)}
			</div>
		</NavigationIconButton>
	);
};

export interface SwitchButtonProps {
	href: string;
	Icon: FC<IconComponentProps & { gradient?: boolean }>;
}

export const SwitchButton: FC<SwitchButtonProps> = ({ Icon, ...props }) => {
	const location = useLocation();
	const active = urlEqual(toAbsoluteUrl(props.href), location);

	return (
		<Link
			{...props}
			className={twMerge(
				"group flex shrink-0 items-center gap-2 rounded-full p-2 transition-colors focus:outline-none",
				active
					? Icon === HeartIcon
						? "bg-brand-gradient bg-cover bg-center text-white-20 shadow-brand-1 sm:bg-[url('https://media.flirtu.al/deeabe0a-dac2-4452-98f7-9778490acc92/')]"
						: "bg-brand-gradient text-white-20 shadow-brand-1"
					: "hocus:bg-white-20 hocus:text-black-70 hocus:shadow-brand-1"
			)}
		>
			<Icon className="aspect-square h-6 sm:h-8" gradient={!active} />
			{(Icon === HeartIcon || Icon === PeaceIcon) && (
				<span
					className={twMerge(
						"hidden pr-2 sm:block",
						active ? "text-white-20" : "text-black-70 dark:text-white-20"
					)}
				>
					{Icon === HeartIcon ? "Ranked" : "Casual"}
				</span>
			)}
		</Link>
	);
};

const NavigationalSwitch: FC<ComponentProps<"div">> = ({
	children,
	...elementProps
}) => (
	<div
		{...elementProps}
		className={twMerge(
			"flex gap-4 rounded-full bg-white-10 p-2 shadow-brand-inset dark:bg-black-70",
			elementProps.className
		)}
	>
		{children}
	</div>
);

export const AuthenticatedNavigation: FC = () => {
	return (
		<>
			<ProfileNavigation href={urls.user.me} />
			<NavigationalSwitch id="browse-mode-switch">
				<SwitchButton href={urls.browse()} Icon={HeartIcon} />
				<SwitchButton href={urls.browse("friend")} Icon={PeaceIcon} />
			</NavigationalSwitch>
			<ConversationListButton />
		</>
	);
};

export const GuestNavigation: FC = () => {
	return (
		<NavigationalSwitch>
			<SwitchButton href={urls.default} Icon={HomeIcon} />
			<SwitchButton href={urls.login()} Icon={LoginIcon} />
		</NavigationalSwitch>
	);
};

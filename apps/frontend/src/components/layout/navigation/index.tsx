"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { useLocation } from "~/hooks/use-location";
import { useUnreadConversations } from "~/hooks/use-talkjs";
import { toAbsoluteUrl, urlEqual, urls } from "~/urls";
import { clamp } from "~/utilities";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { HomeIcon } from "~/components/icons/gradient/home";
import { LoginIcon } from "~/components/icons/gradient/login";

import { ProfileNavigation } from "./profile";

import type { IconComponentProps } from "~/components/icons";
import type { ComponentProps, FC } from "react";

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

export const ConversationListButton: FC<{ id?: string }> = ({ id }) => {
	const conversationCount = clamp(useUnreadConversations().length, 0, 99);

	return (
		<NavigationIconButton
			href={urls.conversations.list()}
			id={id}
		>
			<div className="relative">
				<ChatBubbleLeftRightIcon
					className="aspect-square w-8"
					strokeWidth={1.5}
				/>
				{conversationCount !== 0 && (
					<div className="absolute -right-2 top-0 flex size-5 items-center justify-center rounded-full bg-brand-gradient opacity-100 ring-[2.5px] ring-white-20 transition-all group-hocus:size-0 group-hocus:opacity-0">
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
	className?: string;
}

export const SwitchButton: FC<SwitchButtonProps> = ({
	Icon,
	className,
	...props
}) => {
	const location = useLocation();
	const active = urlEqual(toAbsoluteUrl(props.href), location);

	return (
		<Link
			{...props}
			data-active={active ? "" : undefined}
			className={twMerge(
				"group shrink-0 rounded-full p-2 transition-colors focus:outline-none data-[active]:shadow-brand-1 hocus:shadow-brand-1",
				className
			)}
		>
			<Icon
				className="aspect-square h-6 group-hocus:fill-white-20 desktop:h-8"
				gradient={!active}
			/>
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

export const AuthenticatedNavigation: FC<{ mobile?: boolean }> = ({ mobile = false }) => {
	return (
		<>
			<ProfileNavigation href={urls.user.me} id={`profile-dropdown-button${mobile ? "-mobile" : ""}`} />
			<NavigationalSwitch id={`browse-mode-switch${mobile ? "-mobile" : ""}`}>
				<SwitchButton
					href={urls.browse()}
					Icon={HeartIcon}
					className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
				/>
				<SwitchButton
					href={urls.browse("friend")}
					Icon={PeaceIcon}
					className="data-[active]:bg-brand-gradient-green hocus:bg-brand-gradient-green"
				/>
			</NavigationalSwitch>
			<ConversationListButton id={`conversation-button${mobile ? "-mobile" : ""}`} />
		</>
	);
};

export const GuestNavigation: FC = () => {
	return (
		<NavigationalSwitch>
			<SwitchButton
				href={urls.default}
				Icon={HomeIcon}
				className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
			/>
			<SwitchButton
				href={urls.login()}
				Icon={LoginIcon}
				className="data-[active]:bg-brand-gradient-pink hocus:bg-brand-gradient-pink"
			/>
		</NavigationalSwitch>
	);
};

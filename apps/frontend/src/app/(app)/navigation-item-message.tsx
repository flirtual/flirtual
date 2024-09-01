"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import { useFormatter } from "next-intl";

import { useUnreadConversations } from "~/hooks/use-talkjs";
import { urls } from "~/urls";
import { clamp } from "~/utilities";

import { NavigationItem } from "./navigation-item";

import type { FC } from "react";

export const NavigationItemMessage: FC = () => {
	const formatter = useFormatter();
	const conversationCount = clamp(useUnreadConversations().length, 0, 99);

	return (
		<NavigationItem href={urls.conversations.list()} id="conversation-button">
			<div className="relative">
				<ChatBubbleLeftRightIcon
					className="aspect-square w-8"
					strokeWidth={1.5}
				/>
				{conversationCount !== 0 && (
					<div className="absolute left-5 top-0 flex h-5 w-fit items-center justify-center rounded-full bg-brand-gradient px-1 opacity-100 ring-[2.5px] ring-white-20 transition-all group-hocus:scale-0 group-hocus:opacity-0">
						<span className="select-none text-sm font-semibold leading-none text-white-20">
							{formatter.number(conversationCount)}
						</span>
					</div>
				)}
			</div>
		</NavigationItem>
	);
};

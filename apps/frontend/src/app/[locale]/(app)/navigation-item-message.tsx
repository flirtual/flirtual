import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import { useFormatter } from "next-intl";
import type { FC } from "react";
import { clamp } from "remeda";

import { useUnreadConversations } from "~/hooks/use-talkjs";
import { urls } from "~/urls";

import { NavigationItem } from "./navigation-item";

export const NavigationItemMessage: FC = () => {
	const formatter = useFormatter();
	const conversationCount = clamp(useUnreadConversations().length, { min: 0, max: 99 });

	return (
		<NavigationItem id="conversation-button" href={urls.conversations.list()}>
			<div className="relative">
				<ChatBubbleLeftRightIcon
					className="aspect-square w-8"
					strokeWidth={1.5}
				/>
				{conversationCount !== 0 && (
					<div className="absolute left-5 top-0 flex h-5 w-fit shrink-0 items-center justify-center rounded-full bg-brand-gradient px-1 opacity-100 ring-[2.5px] ring-white-20 transition-all group-hocus:scale-0 group-hocus:opacity-0">
						<span className="text-sm font-semibold leading-none text-white-20">
							{formatter.number(conversationCount)}
						</span>
					</div>
				)}
			</div>
		</NavigationItem>
	);
};

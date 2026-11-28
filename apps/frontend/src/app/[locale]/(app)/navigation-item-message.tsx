import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import type { FC, MouseEventHandler } from "react";

import { useUnreadConversations } from "~/hooks/use-unread-conversations";
import { useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";
import { urls } from "~/urls";

import { NavigationItem } from "./navigation-item";

export const NavigationItemMessage: FC<{ onClick?: MouseEventHandler }> = ({ onClick }) => {
	const [locale] = useLocale();
	const { unreadConversations, loadedAllUnreadConversations } = useUnreadConversations();
	const conversationCount = unreadConversations.length;

	return (
		<NavigationItem id="conversation-button" className="split:hidden" href={urls.conversations.list()} onClick={onClick}>
			<div className="relative">
				<ChatBubbleLeftRightIcon
					className="aspect-square w-8"
					strokeWidth={1.5}
				/>
				{conversationCount !== 0 && (
					<div className="absolute top-0 left-5 flex h-5 w-fit min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-gradient px-1 opacity-100 ring-[2.5px] ring-white-20 transition-all group-hocus:scale-0 group-hocus:opacity-0">
						<span className="text-sm leading-none font-semibold text-white-20">
							{new Intl.NumberFormat(intlLocale(locale)).format(conversationCount)}
							{!loadedAllUnreadConversations && "+"}
						</span>
					</div>
				)}
			</div>
		</NavigationItem>
	);
};

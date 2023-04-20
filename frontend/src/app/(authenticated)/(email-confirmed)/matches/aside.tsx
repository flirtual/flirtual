import { twMerge } from "tailwind-merge";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

import { ButtonLink } from "~/components/button";
import { thruServerCookies, withSession } from "~/server-utilities";
import { api } from "~/api";
import { urls } from "~/urls";

import { withConversations } from "./data";
import { ConversationListItem } from "./list-item";

export async function ConversationAside({ activeConversation }: { activeConversation?: string }) {
	const session = await withSession();

	const conversations = await withConversations();

	const likes = await api.matchmaking.listMatches({
		...thruServerCookies(),
		query: {
			unrequited: true
		}
	});

	const HeaderIcon = activeConversation ? ChevronLeftIcon : XMarkIcon;

	return (
		<div className="flex w-full shrink-0 grow-0 flex-col sm:min-h-[calc(100vh-9rem)] md:w-96 md:rounded-t-xl md:bg-white-20 md:shadow-brand-1 dark:md:bg-black-70">
			<div className="flex h-16 w-full items-center justify-center bg-black-70 p-4 text-white-20 md:rounded-t-xl md:bg-brand-gradient">
				<Link
					className="absolute left-4 flex shrink-0 md:hidden"
					href={activeConversation ? urls.conversations.list : urls.browse()}
				>
					<HeaderIcon className="w-6" />
				</Link>
				<span className="font-montserrat text-xl font-semibold">Messages</span>
			</div>
			<div
				className={twMerge(
					"flex h-full flex-col gap-8 px-4 py-6",
					activeConversation && "hidden sm:flex"
				)}
			>
				<ButtonLink
					className="w-fit"
					href={session.user.subscription?.active ? urls.likes : urls.subscription}
					size="sm"
				>
					See who liked you{" "}
					{likes.count.love && (likes.count.love > 99 ? "(99+❤️)" : ` (${likes.count.love}❤️)`)}
					{likes.count.friend &&
						(likes.count.friend > 99 ? "(99+✌️)" : ` (${likes.count.friend}✌️)`)}
				</ButtonLink>
				<div className="flex flex-col gap-4">
					{conversations.map((conversation) => (
						<ConversationListItem
							{...conversation}
							active={activeConversation === conversation.userId}
							key={conversation.id}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

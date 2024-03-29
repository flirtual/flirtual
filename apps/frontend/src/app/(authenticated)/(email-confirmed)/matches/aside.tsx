"use client";

import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { FC, Suspense, useLayoutEffect } from "react";
import { useInView } from "react-intersection-observer";
import { CheckCheck, ChevronLeft, X } from "lucide-react";

import { urls } from "~/urls";
import { useConversations } from "~/hooks/use-conversations";
import { useUnreadConversations } from "~/hooks/use-talkjs";
import { Button } from "~/components/button";
import { api } from "~/api";
import { useToast } from "~/hooks/use-toast";

import {
	ConversationListItem,
	ConversationListItemSkeleton
} from "./list-item";
import { LikesYouButton } from "./likes-you-button";

export interface ConversationAsideProps {
	activeConversationId?: string;
}

export const ConversationAside: FC<ConversationAsideProps> = (props) => {
	const toasts = useToast();

	const { activeConversationId } = props;
	const HeaderIcon = activeConversationId ? ChevronLeft : X;

	const { data, mutate, loadMore } = useConversations();
	const [loadMoreReference, loadMoreInView] = useInView();

	const unreadConversations = useUnreadConversations();

	useLayoutEffect(() => {
		if (!loadMoreInView) return;
		void loadMore();
	}, [loadMoreInView, loadMore]);

	return (
		<div className="flex w-full shrink-0 grow-0 select-none flex-col md:min-h-[calc(100vh-9rem)] md:w-96 md:rounded-t-xl md:bg-white-20 md:shadow-brand-1 dark:md:bg-black-70">
			<div className="fixed z-10 flex w-full items-center justify-center bg-black-70 p-4 pt-[max(calc(env(safe-area-inset-top)+0.5rem),1rem)] text-white-20 md:static md:rounded-t-xl md:bg-brand-gradient">
				<Link
					className="absolute left-4 flex shrink-0 vision:left-8 md:hidden"
					href={
						activeConversationId ? urls.conversations.list() : urls.browse()
					}
				>
					<HeaderIcon className="w-6" />
				</Link>
				<span className="font-montserrat text-xl font-semibold">Messages</span>
			</div>
			<div
				className={twMerge(
					"flex h-full flex-col gap-8 px-4 pb-6 pt-[calc(env(safe-area-inset-top)+5rem)] vision:bg-transparent md:pt-6",
					activeConversationId && "hidden md:flex"
				)}
			>
				<div className="flex flex-col gap-2">
					<LikesYouButton />
					{unreadConversations.length > 0 && (
						<Button
							Icon={CheckCheck}
							size="sm"
							onClick={async () => {
								await api.conversations
									.markRead()
									.then(async () => await mutate())
									.catch(toasts.addError);
								return;
							}}
						>
							Mark all as read
						</Button>
					)}
				</div>
				<div className="flex flex-col gap-4">
					{data.map(({ data: conversations, metadata }, dataIndex) => (
						<div
							className="flex flex-col gap-4"
							key={metadata.cursor.self.page}
						>
							{conversations.map((conversation, conversationIndex) => (
								<Suspense
									fallback={<ConversationListItemSkeleton />}
									key={conversation.id}
								>
									<ConversationListItem
										{...conversation}
										active={activeConversationId === conversation.id}
										lastItem={
											dataIndex === data.length - 1 &&
											conversationIndex === conversations.length - 1
										}
									/>
								</Suspense>
							))}
						</div>
					))}
					<div ref={loadMoreReference} />
				</div>
			</div>
		</div>
	);
};

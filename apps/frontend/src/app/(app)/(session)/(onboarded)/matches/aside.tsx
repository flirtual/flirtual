"use client";

import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { type FC, Suspense, useLayoutEffect } from "react";
import { useInView } from "react-intersection-observer";
import { CheckCheck, ChevronLeft, X } from "lucide-react";

import { urls } from "~/urls";
import { useConversations } from "~/hooks/use-conversations";
import { useUnreadConversations } from "~/hooks/use-talkjs";
import { Button } from "~/components/button";
import { useToast } from "~/hooks/use-toast";
import { Conversation } from "~/api/conversations";

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
		<div
			className={twMerge(
				"flex shrink-0 grow-0 select-none flex-col desktop:min-h-[calc(100vh-9rem)] desktop:w-96 desktop:rounded-2xl desktop:bg-brand-gradient desktop:shadow-brand-1",
				activeConversationId ? "w-full" : "desktop:mx-auto desktop:w-[28rem]"
			)}
		>
			<div className="fixed z-10 flex w-full items-center justify-center bg-black-70 p-4 pt-[max(calc(env(safe-area-inset-top,0rem)+0.5rem),1rem)] text-white-20 android:pt-[max(calc(var(--safe-area-inset-top,0rem)+0.5rem),1rem)] desktop:static desktop:bg-transparent desktop:pt-[1.125rem] android:desktop:pt-[1.125rem]">
				<Link
					className="absolute left-4 flex shrink-0 vision:left-8 desktop:hidden"
					href={
						activeConversationId ? urls.conversations.list() : urls.browse()
					}
				>
					<HeaderIcon className="w-6" />
				</Link>
				<span className="font-montserrat text-2xl font-extrabold">Matches</span>
			</div>
			<div className="h-full desktop:p-1 desktop:pt-0">
				<div
					className={twMerge(
						"flex h-full flex-col gap-4 px-4 pb-4 pt-[max(calc(env(safe-area-inset-top,0rem)+4.5rem),5rem)] vision:bg-transparent android:pt-[max(calc(var(--safe-area-inset-top,0rem)+4.5rem),5rem)] desktop:rounded-xl desktop:bg-white-20 desktop:pt-4 desktop:shadow-brand-inset android:desktop:pt-4 dark:desktop:bg-black-70",
						activeConversationId && "hidden desktop:flex"
					)}
				>
					<div className="flex flex-col gap-2">
						<LikesYouButton />
						{unreadConversations.length > 0 && (
							<Button
								Icon={CheckCheck}
								size="sm"
								onClick={async () => {
									await Conversation.markRead()
										.then(async () => await mutate())
										.catch(toasts.addError);
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
					</div>
				</div>
				<div ref={loadMoreReference} />
			</div>
		</div>
	);
};

"use client";

import { CheckCheck, ChevronLeft, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FC, Fragment, Suspense, useLayoutEffect } from "react";
import { useInView } from "react-intersection-observer";
import { twMerge } from "tailwind-merge";

import { Conversation } from "~/api/conversations";
import { Button } from "~/components/button";
import { Link } from "~/components/link";
import { useConversations } from "~/hooks/use-conversations";
import { useUnreadConversations } from "~/hooks/use-talkjs";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

import { LikesYouButton } from "./likes-you-button";
import {
	ConversationListItem,
	ConversationListItemSkeleton
} from "./list-item";

export interface ConversationAsideProps {
	activeConversationId?: string;
}

export const ConversationAside: FC<ConversationAsideProps> = (props) => {
	const toasts = useToast();
	const t = useTranslations();

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
				"flex w-full shrink-0 grow-0 flex-col desktop:w-96 desktop:rounded-2xl desktop:bg-brand-gradient desktop:shadow-brand-1",
				!activeConversationId
				&& "desktop:mx-auto desktop:w-full desktop:max-w-md"
			)}
		>
			<div className="flex w-full items-center justify-center bg-black-70 p-4 pt-[max(calc(var(--safe-area-inset-top,0rem)+0.5rem),1rem)] text-white-20 desktop:static desktop:bg-transparent desktop:pt-[1.125rem]">
				<Link
					href={
						activeConversationId
							? urls.conversations.list()
							: urls.discover("dates")
					}
					className="absolute left-4 flex shrink-0 vision:left-8 desktop:hidden"
				>
					<HeaderIcon className="w-6" />
				</Link>
				<span className="font-montserrat text-2xl font-extrabold">{t("matches")}</span>
			</div>
			<div className="h-full desktop:p-1 desktop:pt-0">
				<div
					className={twMerge(
						"flex h-full flex-col gap-4 p-4 vision:bg-transparent desktop:rounded-xl desktop:bg-white-20 desktop:pt-4 desktop:shadow-brand-inset android:desktop:pt-4 dark:desktop:bg-black-70",
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
								{t("mark_all_as_read")}
							</Button>
						)}
					</div>
					<div className="flex flex-col gap-2">
						{data.map(({ data: conversations, metadata }, dataIndex) => (
							<Fragment key={metadata.cursor.self.page}>
								{conversations.map((conversation, conversationIndex) => (
									<Suspense
										fallback={<ConversationListItemSkeleton />}
										key={conversation.id}
									>
										<ConversationListItem
											{...conversation}
											lastItem={
												dataIndex === data.length - 1
												&& conversationIndex === conversations.length - 1
											}
											active={activeConversationId === conversation.id}
										/>
									</Suspense>
								))}
							</Fragment>
						))}
					</div>
				</div>
				<div ref={loadMoreReference} />
			</div>
		</div>
	);
};

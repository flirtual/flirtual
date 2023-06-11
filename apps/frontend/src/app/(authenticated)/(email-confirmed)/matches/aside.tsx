"use client";

import { twMerge } from "tailwind-merge";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { FC, Suspense } from "react";

import { ConversationListItem } from "./list-item";
import { LikesYouButton } from "./likes-you-button";

import { urls } from "~/urls";
import { useConversations } from "~/hooks/use-conversations";

export interface ConversationAsideProps {
	activeConversationId?: string;
}

export const ConversationAside: FC<ConversationAsideProps> = (props) => {
	const { activeConversationId } = props;
	const HeaderIcon = activeConversationId ? ChevronLeftIcon : XMarkIcon;

	const { data } = useConversations();

	return (
		<div className="flex w-full shrink-0 grow-0 flex-col sm:min-h-[calc(100vh-9rem)] md:w-96 md:rounded-t-xl md:bg-white-20 md:shadow-brand-1 dark:md:bg-black-70">
			<div className="flex h-16 w-full items-center justify-center bg-black-70 p-4 text-white-20 md:rounded-t-xl md:bg-brand-gradient">
				<Link
					className="absolute left-4 flex shrink-0 md:hidden"
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
					"flex h-full flex-col gap-8 px-4 py-6",
					activeConversationId && "hidden sm:flex"
				)}
			>
				<LikesYouButton />
				<div className="flex flex-col gap-4">
					{data.map(({ data: conversations, metadata }, dataIndex) => (
						<Suspense fallback={"Loading..."} key={metadata.cursor.self.page}>
							<div className="flex flex-col gap-4">
								{conversations.map((conversation, conversationIndex) => (
									<ConversationListItem
										{...conversation}
										active={activeConversationId === conversation.id}
										key={conversation.id}
										lastItem={
											dataIndex === data.length - 1 &&
											conversationIndex === conversations.length - 1
										}
									/>
								))}
							</div>
						</Suspense>
					))}
				</div>
			</div>
		</div>
	);
};

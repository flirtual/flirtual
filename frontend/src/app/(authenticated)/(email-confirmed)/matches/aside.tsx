"use client";

import { twMerge } from "tailwind-merge";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { FC, useCallback } from "react";

import { urls } from "~/urls";
import { Button } from "~/components/button";
import { ConversationList } from "~/api/conversations";
import { useConversations } from "~/hooks/use-conversations";

import { ConversationListItem } from "./list-item";
import { LikesYouButton } from "./likes-you-button";

export interface ConversationAsideProps {
	activeConversation?: string;
	initialConversations: ConversationList;
}

export const ConversationAside: FC<ConversationAsideProps> = (props) => {
	const { activeConversation, initialConversations } = props;
	const { data = [], size, setSize } = useConversations(initialConversations);

	const HeaderIcon = activeConversation ? ChevronLeftIcon : XMarkIcon;

	const loadMore = useCallback(() => setSize((size) => size + 1), []);

	return (
		<div className="flex w-full shrink-0 grow-0 flex-col sm:min-h-[calc(100vh-9rem)] md:w-96 md:rounded-t-xl md:bg-white-20 md:shadow-brand-1 dark:md:bg-black-70">
			<div className="flex h-16 w-full items-center justify-center bg-black-70 p-4 text-white-20 md:rounded-t-xl md:bg-brand-gradient">
				<Link
					className="absolute left-4 flex shrink-0 md:hidden"
					href={activeConversation ? urls.conversations.list() : urls.browse()}
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
				<LikesYouButton />
				<div className="flex flex-col gap-4">
					{data.map(({ data: conversations, metadata }) => (
						<div className="flex flex-col gap-4" key={metadata.cursor.self.page}>
							{conversations.map((conversation) => (
								<ConversationListItem
									{...conversation}
									active={activeConversation === conversation.userId}
									cursor={""}
									key={conversation.id}
								/>
							))}
						</div>
					))}
					<Button className="mx-auto w-fit" size="sm" onClick={loadMore}>
						Load more
					</Button>
					{/* <div className="grid grid-cols-3 items-center gap-2">
						{(metadata.cursor.self.page === 1 || metadata.cursor.previous) && (
							<ButtonLink href={urls.conversations.list(metadata.cursor.previous)} size="sm">
								Back
							</ButtonLink>
						)}
						<div className="col-start-2 flex items-center justify-center">
							<span className="text-sm">{metadata.cursor.self.page + 1}</span>
						</div>
						{metadata.cursor.next && (
							<ButtonLink href={urls.conversations.list(metadata.cursor.next)} size="sm">
								Next
							</ButtonLink>
						)}
					</div> */}
				</div>
			</div>
		</div>
	);
};

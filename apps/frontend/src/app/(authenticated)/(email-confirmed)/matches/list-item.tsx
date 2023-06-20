"use client";

import { useInView } from "framer-motion";
import Link from "next/link";
import { FC, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

import { Conversation } from "~/api/conversations";
import { displayName } from "~/api/user";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { TimeRelative } from "~/components/time-relative";
import { UserAvatar } from "~/components/user-avatar";
import { useConversations } from "~/hooks/use-conversations";
import { useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

export type ConversationListItemProps = Conversation & {
	active?: boolean;
	lastItem?: boolean;
};

export const ConversationListItem: FC<ConversationListItemProps> = (props) => {
	const {
		id,
		kind,
		active = false,
		lastItem = false,
		userId,
		lastMessage
	} = props;

	const { loadMore } = useConversations();

	const reference = useRef<HTMLDivElement>(null);
	const user = useUser(userId);

	const inView = useInView(reference);

	useEffect(() => {
		if (!lastItem || !inView) return;
		void loadMore();
	}, [inView, lastItem, loadMore]);

	if (!user) return null;

	return (
		<div
			ref={reference}
			className={twMerge(
				"relative rounded-xl shadow-brand-1",
				active && "bg-brand-gradient pb-1"
			)}
		>
			<div className="flex rounded-xl bg-white-30 dark:bg-black-60">
				<Link
					className="shrink-0 before:absolute before:h-full before:w-full"
					href={urls.conversations.of(id)}
				>
					<UserAvatar
						className="h-20 w-20 rounded-l-xl"
						height={80}
						user={user}
						width={80}
					/>
				</Link>
				{!(lastMessage?.viewed ?? true) && (
					<div className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-theme-2 shadow-brand-1">
						<div className="h-4 w-4 animate-ping rounded-full bg-theme-1" />
					</div>
				)}
				<div className="flex w-1 grow flex-col p-4">
					<div className="flex justify-between gap-4">
						<span className="truncate font-montserrat text-lg font-semibold leading-tight">
							{displayName(user)}
						</span>
						{kind === "love" ? (
							<HeartIcon className="inline h-5" />
						) : (
							<PeaceIcon className="inline h-5" />
						)}
					</div>
					<div className="flex items-baseline justify-between gap-4">
						<span className="w-full truncate text-black-50 dark:text-white-40">
							{lastMessage?.content ?? "It's a match!"}
						</span>
						{lastMessage && (
							<TimeRelative
								approximate={true}
								approximateTo={60}
								value={lastMessage.createdAt}
								elementProps={{
									className: "shrink-0 text-xs text-black-60 dark:text-white-50"
								}}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

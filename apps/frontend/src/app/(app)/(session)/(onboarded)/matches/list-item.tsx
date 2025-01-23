"use client";

import type { FC, RefAttributes } from "react";
import { twMerge } from "tailwind-merge";

import type { Conversation } from "~/api/conversations";
import { displayName } from "~/api/user";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { TimeRelative } from "~/components/time-relative";
import { UserAvatar } from "~/components/user-avatar";
import { useTranslations } from "~/hooks/use-internationalization";
import { customEmojis } from "~/hooks/use-talkjs";
import { useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

export type ConversationListItemProps = {
	active?: boolean;
	lastItem?: boolean;
} & Conversation;

function replaceEmojis(message: string) {
	return message.split(/(:\w+:)/g).map((part, index) => {
		return customEmojis[part]
			? (
					<Image
						alt={part}
						className="inline-block"
						height={24}
						// eslint-disable-next-line react/no-array-index-key
						key={index}
						src={customEmojis[part].url}
						width={24}
					/>
				)
			: part;
	});
}

export const ConversationListItem: FC<ConversationListItemProps> = (props) => {
	const {
		id,
		kind,
		active = false,
		userId,
		lastMessage,
		isUnread,
	} = props;
	const t = useTranslations();

	const user = useUser(userId);
	// const relationship = useRelationship(userId);
	// if ((!user || !user.relationship?.matched)) return null;
	if (!user) return null;

	return (
		<div
			className={twMerge(
				"relative rounded-xl shadow-brand-1",
				active && "bg-brand-gradient pb-1"
			)}
		>
			<div
				className={twMerge(
					"flex rounded-xl bg-white-30 vision:bg-white-10/50 vision:hover:bg-white-20/50 dark:bg-black-60",
					active && "rounded-b-xl"
				)}
			>
				<Link
					className="shrink-0 before:absolute before:size-full"
					href={urls.conversations.of(id)}
				>
					<UserAvatar
						className="size-20 rounded-l-xl"
						height={80}
						user={user}
						variant="thumb"
						width={80}
					/>
				</Link>
				{isUnread && !active && (
					<div className="absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full bg-theme-2 shadow-brand-1">
						<div className="size-4 animate-ping rounded-full bg-theme-1" />
					</div>
				)}
				<div className="flex w-1 grow flex-col p-4">
					<div className="flex justify-between gap-4">
						<span data-mask className="truncate font-montserrat text-lg font-semibold leading-tight">
							{displayName(user)}
						</span>
						{kind === "love"
							? (
									<HeartIcon className="inline h-5" />
								)
							: (
									<PeaceIcon className="inline h-5" />
								)}
					</div>
					<div className="flex items-baseline justify-between gap-4">
						<span data-mask className="w-full truncate text-black-50 dark:text-white-40">
							{lastMessage && !(lastMessage.system && lastMessage.content === "It's a match!")
								? (
										<>
											{replaceEmojis((lastMessage?.senderId !== userId && !lastMessage.system)
												? t("level_orange_stingray_fulfill", { message: lastMessage.content })
												: lastMessage.content)}
										</>
									)
								: (
										<span className="truncate">{t("talkjs_match_message")}</span>
									)}
						</span>
						{lastMessage && (
							<TimeRelative
								elementProps={{
									className: "shrink-0 text-xs text-black-60 dark:text-white-50"
								}}
								value={lastMessage.createdAt}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export function ConversationListItemSkeleton({ ref }: RefAttributes<HTMLDivElement>) {
	return (
		<div className="relative rounded-xl shadow-brand-1" ref={ref}>
			<div className="flex rounded-xl bg-white-30 vision:bg-white-10/50 dark:bg-black-60">
				<div className="size-20 animate-pulse rounded-l-xl bg-white-20 vision:bg-white-20/50 dark:bg-black-50" />
				<div className="flex w-1 grow flex-col gap-1 p-4">
					<div className="flex justify-between gap-4">
						<span className="h-5 w-1/2 animate-pulse rounded bg-white-20 vision:bg-white-20/50 dark:bg-black-50" />
						<span className="size-5 animate-pulse rounded bg-white-20 vision:bg-white-20/50 dark:bg-black-50" />
					</div>
					<div className="flex items-baseline justify-between gap-4">
						<span className="h-5 w-full animate-pulse rounded bg-white-20 vision:bg-white-20/50 dark:bg-black-50" />
						<span className="h-5 w-1/4 animate-pulse rounded bg-white-20 vision:bg-white-20/50 dark:bg-black-50" />
					</div>
				</div>
			</div>
		</div>
	);
}

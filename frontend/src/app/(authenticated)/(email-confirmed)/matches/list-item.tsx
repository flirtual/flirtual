import Link from "next/link";
import { FC } from "react";
import { twMerge } from "tailwind-merge";

import { Conversation } from "~/api/conversations";
import { User, displayName } from "~/api/user";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { TimeSince } from "~/components/time-since";
import { UserAvatar } from "~/components/user-avatar";
import { urls } from "~/urls";

export type ConversationListItemProps = Conversation & { user: User; active?: boolean };

export const ConversationListItem: FC<ConversationListItemProps> = (props) => {
	const { user, kind, active = false, lastMessage } = props;

	return (
		<div
			className={twMerge("relative rounded-xl shadow-brand-1", active && "bg-brand-gradient pb-1")}
		>
			<div className="flex rounded-xl bg-white-30 dark:bg-black-60">
				<Link
					className="shrink-0 before:absolute before:h-full before:w-full"
					href={urls.conversations.with(user.id)}
				>
					<UserAvatar className="h-20 w-20 rounded-l-xl" height={80} user={user} width={80} />
				</Link>
				{!lastMessage.viewed && (
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
							{lastMessage.content}
						</span>
						<TimeSince
							className="shrink-0 text-xs text-black-60 dark:text-white-50"
							value={lastMessage.createdAt}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

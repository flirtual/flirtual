import Link from "next/link";
import { FC } from "react";
import { twMerge } from "tailwind-merge";

import { Conversation } from "~/api/conversations";
import { User, displayName } from "~/api/user";
import { TimeSince } from "~/components/time-since";
import { urls } from "~/urls";

export type ConversationListItemProps = Conversation & { user: User; active?: boolean };

export const ConversationListItem: FC<ConversationListItemProps> = (props) => {
	const { user, kind, active = false, lastMessage } = props;

	return (
		<div
			className={twMerge(
				"relative overflow-hidden rounded-xl shadow-brand-1",
				active && "bg-brand-gradient pb-1"
			)}
		>
			<div className="flex rounded-b-xl bg-black-60">
				<Link
					className="shrink-0 before:absolute before:h-full before:w-full"
					href={urls.conversations.with(user.id)}
				>
					<img
						className="aspect-square h-20 w-20 rounded-l-xl object-cover"
						src={urls.userAvatar(user)}
					/>
				</Link>
				<div className="flex w-1 grow flex-col p-4">
					<div className="flex justify-between gap-4">
						<span className="truncate font-montserrat text-lg font-semibold leading-tight">
							{displayName(user)}
						</span>
						<span>{kind === "love" ? "❤️" : "✌️"}</span>
					</div>
					<div className="flex items-baseline justify-between gap-4">
						<span className="w-full truncate">{lastMessage.content}</span>
						<TimeSince className="shrink-0 text-xs" value={lastMessage.createdAt} />
					</div>
				</div>
			</div>
		</div>
	);
};

import { Reply, X } from "lucide-react";
import type { FC } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { isKlipyMedia } from "~/api/embed";
import { UserAvatar } from "~/components/user-avatar";

import { useChat, useChatState } from "./context";
import { splitEmoji } from "./custom-emoji";
import { customEmojiNames } from "./custom-emojis";
import { CustomEmoji, Twemoji } from "./emoji";
import { soleLink } from "./links";
import { parseMarkup } from "./markup";
import { useReplyingTo } from "./replying";
import type { ChatReply } from "./store";
import { Markup } from "./text";

const emoji = "size-[1.2em]";

export const ReplyPreview: FC<{ message: Pick<ChatReply, "links" | "senderId" | "text"> }> = ({ message }) => {
	const { t } = useTranslation();
	const { people } = useChat();
	const person = message.senderId ? people[message.senderId] : undefined;
	const nodes = useMemo(() => parseMarkup(message.text, message.links), [message.text, message.links]);
	const gifLink = soleLink(nodes);

	return (
		<span className="flex min-w-0 items-center gap-1">
			{person && (
				<>
					<UserAvatar className="size-4 shrink-0 rounded-full" user={person} variant="icon" />
					<span className="shrink-0 font-semibold">{person.profile.displayName || t("unnamed_user")}</span>
				</>
			)}
			<span className="min-w-0 truncate">
				{gifLink && isKlipyMedia(gifLink)
					? t("gif")
					: splitEmoji(nodes, customEmojiNames).map((segment, index) => {
						/* eslint-disable react/no-array-index-key */
							if (segment.type === "emoji") return <CustomEmoji key={index} name={segment.name} className={emoji} />;
							if (segment.type === "twemoji") return <Twemoji key={index} className={emoji} codepoints={segment.codepoints} text={segment.text} />;
							return <Markup key={index} interactive={false} nodes={segment.children} />;
						/* eslint-enable react/no-array-index-key */
						})}
			</span>
		</span>
	);
};

export const ReplyBar: FC = () => {
	const { t } = useTranslation();
	const { setReplyingTo, reveal } = useChat();
	const { replyingTo } = useChatState();
	useReplyingTo(replyingTo?.id ?? "");

	if (!replyingTo) return null;

	return (
		<div className="flex items-center gap-2 px-3 pt-2 text-sm text-black-80 dark:text-white-20 vision:text-black-80">
			<Reply className="size-4 shrink-0 fill-none! opacity-75" />
			<button
				className="flex min-w-0 grow cursor-pointer items-center text-left opacity-75 hocus:opacity-100"
				type="button"
				onClick={({ currentTarget }) => reveal(replyingTo, currentTarget)}
			>
				<ReplyPreview message={replyingTo} />
			</button>
			<button
				aria-label={t("cancel")}
				className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-75 hocus:opacity-100"
				title={t("cancel")}
				type="button"
				onClick={() => setReplyingTo(null)}
				onMouseDown={(event) => event.preventDefault()}
			>
				<X className="size-4 fill-none!" />
			</button>
		</div>
	);
};

export const ReferencedMessage: FC<{ reply: ChatReply }> = ({ reply }) => {
	const { reveal } = useChat();

	return (
		<button
			className="mb-1 flex max-w-full cursor-pointer items-center gap-1 pl-4 text-[0.85em] text-black-80 opacity-75 dark:text-white-20 hocus:opacity-100 vision:text-black-80"
			type="button"
			onClick={({ currentTarget }) => reveal(reply, currentTarget)}
		>
			<Reply className="size-4 shrink-0 fill-none! opacity-75" />
			<ReplyPreview message={reply} />
		</button>
	);
};

import { getPhotoUrlWithFallback, Text } from "@talkjs/react-components";
import type { CommonChatboxProps, ReferencedMessageProps, ReplyBarProps } from "@talkjs/react-components";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { UserAvatar, UserImage } from "~/components/user-avatar";
import { customEmojiNames } from "~/hooks/use-talkjs";

import { splitEmoji } from "./custom-emoji";
import { CustomEmoji, Twemoji } from "./emoji";
import type { ThemeCustom } from "./theme";

const emoji = "size-[1.2em]";

// The author's photo and name, then the quoted message on one line. People the app has loaded show
// as they do elsewhere in the app; anyone else falls back to their TalkJS name and photo.
export const ReplyPreview: FC<{
	message: ReferencedMessageProps["referencedMessage"] | ReplyBarProps["referencedMessage"];
	common: CommonChatboxProps;
}> = ({ message, common }) => {
	const { t } = useTranslation();
	const { sender } = message;
	const person = sender && (common.themeCustom as ThemeCustom).people[sender.id];
	const [block] = message.content;

	return (
		<span className="flex min-w-0 items-center gap-1">
			{person
				? (
						<>
							<UserAvatar className="size-4 shrink-0 rounded-full" user={person} variant="icon" />
							<span className="shrink-0 font-semibold!">{person.profile.displayName || t("unnamed_user")}</span>
						</>
					)
				: sender && (
					<>
						<UserImage alt="" className="size-4 shrink-0 rounded-full" draggable={false} src={getPhotoUrlWithFallback(sender)} />
						<span className="shrink-0 font-semibold!">{sender.name}</span>
					</>
				)}
			<span className="min-w-0 truncate">
				{message.content.length === 1 && block.type === "text"
					? splitEmoji(block.children, customEmojiNames).map((segment, index) => {
							// eslint-disable-next-line react/no-array-index-key
							if (segment.type === "emoji") return <CustomEmoji key={index} name={segment.name} className={emoji} />;
							// eslint-disable-next-line react/no-array-index-key
							if (segment.type === "twemoji") return <Twemoji key={index} className={emoji} codepoints={segment.codepoints} text={segment.text} />;
							// eslint-disable-next-line react/no-array-index-key
							return <Text key={index} nonInteractive block={{ type: "text", children: segment.children }} message={message} />;
						})
					: <common.theme.CompactMessageContent common={common} message={message} />}
			</span>
		</span>
	);
};

import { Text } from "@talkjs/react-components";
import type { AvatarProps, TextBlockProps, Theme } from "@talkjs/react-components";
import type { FC } from "react";

import { isKlipyMedia } from "~/api/embed";
import type { User } from "~/api/user";
import { UserImage } from "~/components/user-avatar";
import { customEmojiNames } from "~/hooks/use-talkjs";

import { ImageBlock, LocationBlock } from "./attachment-blocks";
import { jumboEmojiSegments, splitEmoji } from "./custom-emoji";
import type { EmojiSegment } from "./custom-emoji";
import { CustomEmoji, Twemoji } from "./emoji";
import { LinkEmbeds } from "./link-embed";
import { messageLinks, soleLink } from "./links";
import type { Match } from "./match-card";
import { isMatchMessage } from "./match-message";
import { Message } from "./message";
import { MessageDivider } from "./message-divider";
import { MessageField } from "./message-field";
import { ReferencedMessage } from "./referenced-message";
import { ReplyBar } from "./reply-bar";

export interface ThemeCustom {
	matchMessage: string;
	/** Set when both people and the kind of match are known, to draw the match message as a card. */
	match?: Match;
	/** The conversation's participants as the app knows them, by TalkJS user id. */
	people: Readonly<Record<string, User>>;
}

const Avatar: FC<AvatarProps> = ({ photoUrl }) => (
	<UserImage alt="" className="size-10 rounded-full shadow-brand-1" draggable={false} src={photoUrl} />
);

const textBlock = "contents [&_.t-emoji]:inline-block [&_.t-emoji]:size-[1.15em] [&_.t-emoji]:align-middle [&_.t-text]:inline [&_.t-text]:whitespace-pre-wrap [&_li]:mb-1 [&_li]:ml-4 [&_li:last-child]:mb-0 [&_ul]:m-0 [&_ul]:pl-0";

// Custom emoji only exist in the Classic SDKs: https://talkjs.com/docs/Features/Messages/Emojis/
const Segment: FC<{ segment: EmojiSegment; message: TextBlockProps["message"] }> = ({ segment, message }) => {
	switch (segment.type) {
		case "emoji":
			return <CustomEmoji name={segment.name} />;
		case "twemoji":
			return <Twemoji codepoints={segment.codepoints} text={segment.text} />;
		case "text":
			return <Text block={{ type: "text", children: segment.children }} message={message} />;
	}
};

const TextBlock: FC<TextBlockProps> = ({ block, message, common }) => {
	const links = messageLinks(block.children);
	const sole = soleLink(block.children);

	if (isMatchMessage(message)) {
		const { matchMessage } = common.themeCustom as ThemeCustom;

		return (
			<div className={textBlock}>
				<Text block={{ type: "text", children: [matchMessage] }} message={message} />
			</div>
		);
	}

	const textShown = !sole || !isKlipyMedia(sole);

	return (
		<>
			{textShown && (
				<div className={textBlock}>
					{jumboEmojiSegments(splitEmoji(block.children, customEmojiNames)).map((segment, index) => (
						// eslint-disable-next-line react/no-array-index-key
						<Segment key={index} message={message} segment={segment} />
					))}
				</div>
			)}
			{links.length > 0 && <LinkEmbeds gifSize={{ width: message.custom.gifWidth, height: message.custom.gifHeight }} links={links} />}
		</>
	);
};

// Hides the typing indicator.
const AfterMessages: FC = () => null;

export const theme: Partial<Theme> = { AfterMessages, Avatar, ImageBlock, LocationBlock, Message, MessageDivider, MessageField, ReferencedMessage, ReplyBar, TextBlock };

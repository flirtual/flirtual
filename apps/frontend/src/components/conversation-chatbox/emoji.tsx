import { parse } from "@twemoji/parser";
import type { FC } from "react";
import { twMerge } from "tailwind-merge";
import { twemojiUrl } from "virtual:twemoji";

import { Image } from "~/components/image";
import { customEmojis } from "~/hooks/use-talkjs";

// One size for every emoji, Twemoji and custom alike, centred on the text around it.
const emojiImage = "mx-[0.05em] inline-block size-[1.375em] align-[-0.3em]";

export const Twemoji: FC<{ text: string; codepoints: string; className?: string }> = ({ text, codepoints, className }) => (
	<Image alt={text} className={twMerge(emojiImage, className)} draggable={false} src={twemojiUrl(codepoints)} />
);

export const CustomEmoji: FC<{ name: string; className?: string }> = ({ name, className }) => (
	<Image alt={name} className={twMerge(emojiImage, className)} draggable={false} src={customEmojis[name].url} />
);

/** A single emoji given as text, such as a reaction: a custom emoji's shortcode or a Unicode emoji. */
export const Emoji: FC<{ text: string; className?: string }> = ({ text, className }) => {
	if (customEmojis[text]) return <CustomEmoji name={text} className={className} />;

	const [emoji] = parse(text, { buildUrl: (codepoints) => codepoints });
	if (!emoji?.url || !text.startsWith(emoji.text)) return <span className={className}>{text}</span>;

	return <Twemoji className={className} codepoints={emoji.url} text={text} />;
};

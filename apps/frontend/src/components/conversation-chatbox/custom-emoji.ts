import type { TextNode } from "@talkjs/core";
import { parse } from "@twemoji/parser";
import type { CustomEmoji, EmojiClickEventDetail } from "emoji-picker-element/shared";

export type EmojiSegment
	= | { type: "emoji"; name: string }
		| { type: "text"; children: Array<TextNode> }
		| { type: "twemoji"; text: string; codepoints: string };

const shortcode = /(:\w+:)/;

// Splits the top level of a text block so custom emoji and Twemoji can render as images between
// runs of ordinary text. Emoji nested in formatting (bold, links, lists) stay as text.
export function splitEmoji(children: Array<TextNode>, names: ReadonlySet<string>): Array<EmojiSegment> {
	const segments: Array<EmojiSegment> = [];

	const pushString = (text: string) => {
		let offset = 0;
		for (const { text: emoji, url: codepoints, indices: [start, end] } of parse(text, { buildUrl: (codepoints) => codepoints })) {
			// The parser returns a redundant variation selector (✋ U+FE0F) as its own entity, with no
			// codepoints: it belongs to the emoji before it, or else it's just text.
			if (!codepoints) continue;

			const selector = text[end] === "\uFE0F" ? "\uFE0F" : "";
			pushText(text.slice(offset, start));
			segments.push({ type: "twemoji", text: emoji + selector, codepoints });
			offset = end + selector.length;
		}
		pushText(text.slice(offset));
	};

	const pushText = (node: TextNode) => {
		if (node === "") return;

		const last = segments.at(-1);
		if (last?.type !== "text") {
			segments.push({ type: "text", children: [node] });
			return;
		}

		const previous = last.children.at(-1);
		if (typeof node === "string" && typeof previous === "string")
			last.children[last.children.length - 1] = previous + node;
		else last.children.push(node);
	};

	for (const node of children) {
		if (typeof node === "string") {
			for (const part of node.split(shortcode)) {
				if (names.has(part)) segments.push({ type: "emoji", name: part });
				else pushString(part);
			}
			continue;
		}

		if (node.type === "customEmoji" && names.has(node.text)) {
			segments.push({ type: "emoji", name: node.text });
			continue;
		}

		pushText(node);
	}

	return segments;
}

// TalkJS inserts a picked custom emoji's name into the message, so the name is its shortcode.
export function customEmojiPickerEntries(emojis: Record<string, { url: string; hidden: boolean }>, category: string): Array<CustomEmoji> {
	return Object.entries(emojis)
		.filter(([, { hidden }]) => !hidden)
		.map(([name, { url }]) => ({ name, shortcodes: [name.slice(1, -1)], url, category }));
}

// TalkJS's editor can't insert custom emoji (it throws "Not implemented"), so we insert the shortcode.
export function pickedCustomEmoji({ emoji }: EmojiClickEventDetail): string | null {
	return "url" in emoji ? emoji.name : null;
}

const jumboEmojiLimit = 3;

// A message of only a few emoji shows them large, like a sticker.
export function isJumboEmoji(segments: Array<EmojiSegment>): boolean {
	const emoji = segments.filter(({ type }) => type !== "text");
	const onlySpaces = segments.every((segment) => segment.type !== "text" || segment.children.every((child) => typeof child === "string" && child.trim() === ""));

	return onlySpaces && emoji.length > 0 && emoji.length <= jumboEmojiLimit;
}

// Message text keeps its whitespace as typed, which around a jumbo emoji pads the sticker.
export function jumboEmojiSegments(segments: Array<EmojiSegment>): Array<EmojiSegment> {
	return isJumboEmoji(segments) ? segments.filter(({ type }) => type !== "text") : segments;
}

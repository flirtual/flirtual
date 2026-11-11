import type { TextNode } from "@talkjs/core";
import { describe, expect, it } from "vitest";

import { customEmojiPickerEntries, isJumboEmoji, jumboEmojiSegments, pickedCustomEmoji, splitEmoji } from "./custom-emoji";

const names = new Set([":bonk:", ":pat:"]);

describe("splitEmoji", () => {
	it("splits known shortcodes out of plain text", () => {
		expect(splitEmoji(["hi :bonk: there"], names)).toEqual([
			{ type: "text", children: ["hi "] },
			{ type: "emoji", name: ":bonk:" },
			{ type: "text", children: [" there"] }
		]);
	});

	it("leaves unknown shortcodes as text", () => {
		expect(splitEmoji(["a :nope: b"], names)).toEqual([
			{ type: "text", children: ["a :nope: b"] }
		]);
	});

	it("turns known customEmoji nodes into emoji and keeps unknown ones", () => {
		const unknown: TextNode = { type: "customEmoji", text: ":nope:" };

		expect(splitEmoji([{ type: "customEmoji", text: ":pat:" }, unknown], names)).toEqual([
			{ type: "emoji", name: ":pat:" },
			{ type: "text", children: [unknown] }
		]);
	});

	it("keeps other nodes in the surrounding text run", () => {
		const bold: TextNode = { type: "bold", children: ["loud :bonk:"] };

		expect(splitEmoji(["a ", bold, " b:pat:"], names)).toEqual([
			{ type: "text", children: ["a ", bold, " b"] },
			{ type: "emoji", name: ":pat:" }
		]);
	});

	it("returns one text segment when there is no emoji", () => {
		expect(splitEmoji(["plain"], names)).toEqual([{ type: "text", children: ["plain"] }]);
	});

	it("splits unicode emoji out as Twemoji, named by codepoints", () => {
		expect(splitEmoji(["hi 😀 there"], names)).toEqual([
			{ type: "text", children: ["hi "] },
			{ type: "twemoji", text: "😀", codepoints: "1f600" },
			{ type: "text", children: [" there"] }
		]);
	});

	it("keeps zero-width-joiner sequences and skin tones as one emoji", () => {
		expect(splitEmoji(["👩‍💻👍🏽"], names)).toEqual([
			{ type: "twemoji", text: "👩‍💻", codepoints: "1f469-200d-1f4bb" },
			{ type: "twemoji", text: "👍🏽", codepoints: "1f44d-1f3fd" }
		]);
	});

	it("keeps a redundant variation selector with its emoji, which the parser splits off", () => {
		expect(splitEmoji(["✋\uFE0F"], names)).toEqual([
			{ type: "twemoji", text: "✋\uFE0F", codepoints: "270b" }
		]);
	});

	it("leaves a variation selector after ordinary text as text", () => {
		expect(splitEmoji(["a\uFE0F"], names)).toEqual([
			{ type: "text", children: ["a\uFE0F"] }
		]);
	});

	it("splits custom and unicode emoji in the same text", () => {
		expect(splitEmoji([":bonk: and 🎉"], names)).toEqual([
			{ type: "emoji", name: ":bonk:" },
			{ type: "text", children: [" and "] },
			{ type: "twemoji", text: "🎉", codepoints: "1f389" }
		]);
	});

	it("handles adjacent shortcodes without empty text runs", () => {
		expect(splitEmoji([":bonk::pat:"], names)).toEqual([
			{ type: "emoji", name: ":bonk:" },
			{ type: "emoji", name: ":pat:" }
		]);
	});
});

describe("customEmojiPickerEntries", () => {
	it("lists visible custom emoji under one category, named by shortcode", () => {
		expect(customEmojiPickerEntries({
			":bonk:": { url: "https://example.com/bonk.gif", hidden: false },
			":secret:": { url: "https://example.com/secret.png", hidden: true },
			":pat:": { url: "https://example.com/pat.gif", hidden: false }
		}, "Flirtual")).toEqual([
			{ name: ":bonk:", shortcodes: ["bonk"], url: "https://example.com/bonk.gif", category: "Flirtual" },
			{ name: ":pat:", shortcodes: ["pat"], url: "https://example.com/pat.gif", category: "Flirtual" }
		]);
	});
});

describe("pickedCustomEmoji", () => {
	it("returns the shortcode of a picked custom emoji", () => {
		expect(pickedCustomEmoji({
			emoji: { name: ":bonk:", shortcodes: ["bonk"], url: "https://example.com/bonk.gif", category: "Flirtual" },
			name: ":bonk:",
			skinTone: 0
		})).toBe(":bonk:");
	});

	it("ignores standard emoji, which TalkJS inserts itself", () => {
		expect(pickedCustomEmoji({
			emoji: { annotation: "grinning face", group: 0, name: "grinning face", order: 1, version: 1, unicode: "😀" },
			unicode: "😀",
			skinTone: 0
		})).toBeNull();
	});
});

describe("isJumboEmoji", () => {
	const jumbo = (...children: Array<TextNode>) => isJumboEmoji(splitEmoji(children, names));

	it("enlarges one to three emoji, standard or custom, with only spaces between", () => {
		expect(jumbo("😀")).toBe(true);
		expect(jumbo(":bonk:")).toBe(true);
		expect(jumbo("😀 :pat: 🎉")).toBe(true);
		expect(jumbo(" 👩‍💻\n")).toBe(true);
	});

	it("keeps more than three emoji at text size", () => {
		expect(jumbo("😀😀😀😀")).toBe(false);
	});

	it("keeps emoji with any text at text size", () => {
		expect(jumbo("hi 😀")).toBe(false);
		expect(jumbo("😀 :nope:")).toBe(false);
		expect(jumbo({ type: "bold", children: ["😀"] })).toBe(false);
		expect(jumbo("")).toBe(false);
	});
});

describe("jumboEmojiSegments", () => {
	it("drops the whitespace around jumbo emoji, which would otherwise pad the sticker", () => {
		expect(jumboEmojiSegments(splitEmoji([" ✋ :pat:\n"], names))).toEqual([
			{ type: "twemoji", text: "✋", codepoints: "270b" },
			{ type: "emoji", name: ":pat:" }
		]);
	});

	it("leaves messages that aren't jumbo untouched", () => {
		const segments = splitEmoji(["hi ✋ "], names);
		expect(jumboEmojiSegments(segments)).toBe(segments);
	});
});

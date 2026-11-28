import { describe, expect, it } from "vitest";

import { parseMarkup } from "./markup";
import type { LinkSpan } from "./markup";

const span = (text: string, link: string): LinkSpan => ({ start: text.indexOf(link), length: link.length });

describe("parseMarkup", () => {
	it("leaves plain text alone", () => {
		expect(parseMarkup("hello there")).toEqual(["hello there"]);
	});

	it("parses bold, italic and strikethrough", () => {
		expect(parseMarkup("**a** __b__ *c* _d_ ~~e~~")).toEqual([
			{ type: "bold", children: ["a"] },
			" ",
			{ type: "bold", children: ["b"] },
			" ",
			{ type: "italic", children: ["c"] },
			" ",
			{ type: "italic", children: ["d"] },
			" ",
			{ type: "strikethrough", children: ["e"] }
		]);
	});

	it("nests marks", () => {
		expect(parseMarkup("**bold _both_**")).toEqual([
			{ type: "bold", children: ["bold ", { type: "italic", children: ["both"] }] }
		]);
		expect(parseMarkup("*a **b** c*")).toEqual([
			{ type: "italic", children: ["a ", { type: "bold", children: ["b"] }, " c"] }
		]);
		expect(parseMarkup("***a***")).toEqual([
			{ type: "bold", children: [{ type: "italic", children: ["a"] }] }
		]);
	});

	it("ignores marks inside words and around spaces", () => {
		expect(parseMarkup("snake_case_name and 2 * 3 * 4")).toEqual(["snake_case_name and 2 * 3 * 4"]);
	});

	it("leaves an unclosed mark as text", () => {
		expect(parseMarkup("**not closed")).toEqual(["**not closed"]);
		expect(parseMarkup("*not closed")).toEqual(["*not closed"]);
	});

	it("leaves a single tilde and backticks as text", () => {
		expect(parseMarkup("~a~ `b`")).toEqual(["~a~ `b`"]);
	});

	it("links nothing by itself", () => {
		expect(parseMarkup("see https://youtu.be/x and evil.com")).toEqual(["see https://youtu.be/x and evil.com"]);
	});

	it("links the positions it is given", () => {
		const text = "😀 see https://youtu.be/x. and vrchat.com/home";
		expect(parseMarkup(text, [span(text, "https://youtu.be/x"), span(text, "vrchat.com/home")])).toEqual([
			"😀 see ",
			{ type: "autoLink", url: "https://youtu.be/x", text: "https://youtu.be/x" },
			". and ",
			{ type: "autoLink", url: "https://vrchat.com/home", text: "vrchat.com/home" }
		]);
	});

	it("does not format a link's underscores", () => {
		const text = "_a_ https://youtu.be/a_b_c";
		expect(parseMarkup(text, [span(text, "https://youtu.be/a_b_c")])).toEqual([
			{ type: "italic", children: ["a"] },
			" ",
			{ type: "autoLink", url: "https://youtu.be/a_b_c", text: "https://youtu.be/a_b_c" }
		]);
	});

	it("finds a position inside a later paragraph or bullet", () => {
		const text = "first\n- one vrch.at/a\n- two\nlast youtu.be/b";
		expect(parseMarkup(text, [span(text, "vrch.at/a"), span(text, "youtu.be/b")])).toEqual([
			"first",
			{
				type: "bulletList",
				children: [
					{ type: "bulletPoint", children: ["one ", { type: "autoLink", url: "https://vrch.at/a", text: "vrch.at/a" }] },
					{ type: "bulletPoint", children: ["two"] }
				]
			},
			"last ",
			{ type: "autoLink", url: "https://youtu.be/b", text: "youtu.be/b" }
		]);
	});

	it("ignores a position that runs past the text", () => {
		expect(parseMarkup("short", [{ start: 2, length: 50 }])).toEqual(["short"]);
	});

	it("groups consecutive bullet lines into one list", () => {
		expect(parseMarkup("list:\n- one\n- **two**\nafter")).toEqual([
			"list:",
			{
				type: "bulletList",
				children: [
					{ type: "bulletPoint", children: ["one"] },
					{ type: "bulletPoint", children: [{ type: "bold", children: ["two"] }] }
				]
			},
			"after"
		]);
	});
});

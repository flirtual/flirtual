import { describe, expect, it } from "vitest";

import { html } from "./html";

describe("html", () => {
	it("keeps the allowed tags", () => {
		const value = "<h3>a</h3><p><strong>b</strong> <em>c</em> <u>d</u></p><ul><li>e</li></ul><ol><li>f</li></ol><blockquote>g</blockquote>";
		expect(html(value)).toBe(value);
	});

	it("unwraps tags outside the list", () => {
		expect(html("<h1>a</h1><s>b</s><div>c</div>")).toBe("abc");
	});

	it("removes scripts, styles and their contents", () => {
		expect(html("<p>a</p><script>alert(1)</script><style>p{color:red}</style>")).toBe("<p>a</p>");
	});

	it("removes elements that load or run something", () => {
		expect(html("<img src=\"x\" onerror=\"alert(1)\"><iframe src=\"https://example.com\"></iframe><p>a</p>")).toBe("<p>a</p>");
	});

	it("removes every attribute but style", () => {
		expect(html("<p onclick=\"alert(1)\" id=\"a\" class=\"b\" data-c=\"d\" aria-label=\"e\" title=\"f\">g</p>")).toBe("<p>g</p>");
	});

	it("leaves links without a destination", () => {
		expect(html("<a href=\"/browse\">a</a><a href=\"javascript:alert(1)\">b</a>")).toBe("<a>a</a><a>b</a>");
	});

	it("keeps palette colours, written as hex", () => {
		expect(html("<span style=\"color: rgb(221, 66, 106); background-color: #FFFFFF;\">a</span>"))
			.toBe("<span style=\"color:#dd426a;background-color:#ffffff\">a</span>");
	});

	it("turns the editor's alignment class into a style", () => {
		expect(html("<p class=\"ql-align-center\">a</p>")).toBe("<p style=\"text-align:center\">a</p>");
	});

	it("keeps an alignment style", () => {
		expect(html("<p style=\"text-align: right;\">a</p>")).toBe("<p style=\"text-align:right\">a</p>");
	});

	it("removes style properties outside the list", () => {
		expect(html("<p style=\"position: fixed; top: 0; color: #dd426a;\">a</p>")).toBe("<p style=\"color:#dd426a\">a</p>");
	});

	it("removes colours outside the palette", () => {
		expect(html("<span style=\"color: #123456;\">a</span><span style=\"background-color: red;\">b</span>")).toBe("<span>a</span><span>b</span>");
	});

	it("removes a colour that only starts with a palette colour", () => {
		expect(html("<span style=\"color: #dd426a99;\">a</span>")).toBe("<span>a</span>");
	});

	it("removes a colour named after the palette's empty entry", () => {
		expect(html("<span style=\"color: false;\">a</span>")).toBe("<span>a</span>");
	});

	it("removes a colour carrying a second value", () => {
		expect(html("<span style=\"color: #dd426a url(https://example.com/a.png);\">a</span>")).toBe("<span>a</span>");
	});

	it("removes alignments the editor cannot produce", () => {
		expect(html("<p style=\"text-align: -webkit-center;\">a</p>")).toBe("<p>a</p>");
	});
});

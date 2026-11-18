import type { PropertiesHyphen } from "csstype";
import createDOMPurify from "dompurify";
import { entries } from "remeda";

import { rgb } from "./colors";

export function toStyleProperties(
	style: PropertiesHyphen,
	initial: string = ""
): string {
	return entries(style).reduce(
		(previous, current) =>
			current
				? `${previous ? `${previous};` : ""}${current[0]}:${current[1]}`
				: previous,
		initial
	);
}

export function fromStyleProperties(value: string): PropertiesHyphen {
	return Object.fromEntries(
		value
			.split(";")
			.map((v) => v.trim())
			.filter((v) => !!v)
			.map((v) => {
				const a = v.split(/:\s?/);
				return [a.shift(), a.join(":")];
			})
	) as PropertiesHyphen;
}

export const allowedTags: Array<keyof React.JSX.IntrinsicElements> = [
	"a",
	"b",
	"blockquote",
	"br",
	"em",
	"hr",
	"h3",
	"li",
	"p",
	"span",
	"strong",
	"ul",
	"ol",
	"u"
];

export const editorColors = [
	false,
	// "#000000",
	"#dd426a",
	"#ffb20f",
	"#8de120",
	"#25c9d0",
	"#7333d7",
	"#ffffff",
	"#f5c6d2",
	"#ffe8b7",
	"#ddf6bc",
	"#beeff1",
	"#d5c2f3",
	"#bbbbbb",
	"#e77b97",
	"#ffc957",
	"#afea63",
	"#66d9de",
	"#9d70e3",
	"#888888",
	"#b22046",
	"#c18300",
	"#639f15",
	"#198a8f",
	"#511f9e",
	"#444444",
	"#72142c",
	"#754f00",
	"#2b4509",
	"#0a3738",
	"#250e49"
];

// Palette colors with poor contrast against a light background.
const lightPaletteColors = new Set([
	"#ffffff",
	"#f5c6d2",
	"#ffe8b7",
	"#ddf6bc",
	"#beeff1",
	"#d5c2f3"
]);

// Palette colors with poor contrast against a dark background.
const darkPaletteColors = new Set([
	"#444444",
	"#72142c",
	"#754f00",
	"#2b4509",
	"#0a3738",
	"#250e49"
]);

export const biographyMaxLength = 10_000;
export const biographyCounterThreshold = 8000;

// Collapse 3+ consecutive and strip any leading/trailing blank lines. Matches
// collapse_blank_lines/1 in profiles.ex.
export function collapseBlankLines(value: string): string {
	return value
		.replace(/^(?:<p>(?:<br\s?\/?>)+<\/p>)+/, "")
		.replace(/(?:<p>(?:<br\s?\/?>)+<\/p>)+$/, "")
		.replaceAll(
			/((?:<p>(?:<br\s?\/?>)+<\/p>){2})(?:<p>(?:<br\s?\/?>)+<\/p>)+/g,
			"$1"
		);
}

// Length of rich-text content: visible text in Unicode codepoints plus rendered
// newlines. Matches content_length/1 in profiles.ex.
export function contentLength(value: string): number {
	const { body } = new DOMParser().parseFromString(
		collapseBlankLines(value),
		"text/html"
	);

	const lines = body.querySelectorAll(
		"p, h1, h2, h3, h4, h5, h6, blockquote, li, pre"
	).length;

	return [...(body.textContent ?? "")].length + lines;
}

const paletteColors = new Set(editorColors.filter((color) => color !== false));
const textAlignments = ["left", "center", "right", "justify"] as const;

const colorRgbRegex
	= /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
const alignmentClassRegex = /(?:^|\s)ql-align-(\w+)/;

function paletteColor(value: string) {
	const match = value.match(colorRgbRegex);
	const color = match
		? rgb.toHex(
				Number.parseInt(match[1]!),
				Number.parseInt(match[2]!),
				Number.parseInt(match[3]!)
			)
		: value.toLowerCase();

	return paletteColors.has(color) ? color : undefined;
}

function allowedStyle(element: Element): PropertiesHyphen {
	const { style } = element as HTMLElement;
	if (!style) return {};

	const color = paletteColor(style.getPropertyValue("color"));
	const backgroundColor = paletteColor(style.getPropertyValue("background-color"));
	const requestedTextAlign = element.getAttribute("class")?.match(alignmentClassRegex)?.[1]
		?? style.getPropertyValue("text-align");
	const textAlign = textAlignments.find((alignment) => alignment === requestedTextAlign);

	return {
		...(color && { color }),
		...(backgroundColor && { "background-color": backgroundColor }),
		...(textAlign && { "text-align": textAlign })
	};
}

const purify = createDOMPurify();

// Without a DOM, DOMPurify has no methods and would return its input unchanged.
// https://github.com/cure53/DOMPurify#what-is-supported
if (purify.isSupported) {
	purify.addHook("beforeSanitizeAttributes", (element) => {
		if (element.nodeType !== element.ELEMENT_NODE) return;

		const style = toStyleProperties(allowedStyle(element));

		if (style) element.setAttribute("style", style);
		else element.removeAttribute("style");
	});
}

export function html(value: string) {
	if (!purify.isSupported) return "";

	return purify.sanitize(value, {
		ALLOWED_TAGS: allowedTags,
		ALLOWED_ATTR: ["style"],
		ALLOW_ARIA_ATTR: false,
		ALLOW_DATA_ATTR: false
	});
}

// Add a class to bio elements whose color or background is low-contrast on one
// theme; html.scss gives them an opposite background or color respectively.
// Elements with both a color and background are ignored (maybe the author wanted
// them to be illegible).
export function markLowContrastColors(value: string): string {
	const { body } = new DOMParser().parseFromString(value, "text/html");

	for (const element of body.querySelectorAll<HTMLElement>("[style]")) {
		const style = fromStyleProperties(element.getAttribute("style") ?? "");

		const color = style.color?.toLowerCase();
		const background = style["background-color"]?.toLowerCase();
		if (color && background) continue;

		const className
			= (color && lightPaletteColors.has(color) && "bio-color-light")
				|| (color && darkPaletteColors.has(color) && "bio-color-dark")
				|| (background && lightPaletteColors.has(background) && "bio-background-light")
				|| (background && darkPaletteColors.has(background) && "bio-background-dark");

		if (className) element.classList.add(className);
	}

	return body.innerHTML;
}

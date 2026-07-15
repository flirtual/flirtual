import type { PropertiesHyphen, Property } from "csstype";
import { entries } from "remeda";
import sanitizeHtml from "sanitize-html";
import type { Attributes } from "sanitize-html";

import { rgb } from "./colors";
import { siteOrigin } from "./const";
import { isInternalHref, toAbsoluteUrl } from "./urls";

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

const colorHexRegex = new RegExp(editorColors.join("|"), "i");
const colorRgbRegex
	= /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

const allowedOrigins = new Set([siteOrigin, "https://vrchat.com"]);

export function html(value: string) {
	return sanitizeHtml(
		value /* .replaceAll(/<p>(((\s)|(<br>))+)<\/p>|<h\d>(((\s)|(<br>))+)<\/h\d>/gi, "") */,
		{
			allowedTags,
			allowedAttributes: {
				"*": ["style"]
			},
			allowedStyles: {
				"*": {
					color: [colorHexRegex],
					"background-color": [colorHexRegex],
					"text-align": [/\w+/]
				}
			},
			allowedSchemes: ["http", "https"],
			transformTags: {
				"*": (tagName: string, attribs: Attributes) => {
					let style = fromStyleProperties(attribs.style ?? "");

					const alignMatch = attribs.class?.match(/ql-align-(\w+)/);
					if (attribs.class && alignMatch) {
						attribs.class = attribs.class.replace(alignMatch[0], "");
						style = {
							...style,
							"text-align": alignMatch[1] as Property.TextAlign
						};
					}

					for (const key of ["color", "background-color"] as const) {
						const match = style[key]?.match(colorRgbRegex);
						if (match) {
							style = {
								...style,
								[key]: rgb.toHex(
									Number.parseInt(match[1]!),
									Number.parseInt(match[2]!),
									Number.parseInt(match[3]!)
								)
							};
						}
					}

					attribs.style = toStyleProperties(style);

					return {
						tagName,
						attribs
					};
				},
				a: (tagName, attribs) => {
					const url = toAbsoluteUrl(attribs.href ?? "/");

					if (isInternalHref(url)) return { tagName, attribs };
					if (!allowedOrigins.has(url.origin))
						return { tagName: "span", attribs };

					return {
						tagName,
						attribs: { ...attribs, target: "_blank", rel: "noopener" }
					};
				}
			}
		}
	);
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

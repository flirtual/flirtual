import { PropertiesHyphen, Property } from "csstype";
import sanitizeHtml, { Attributes } from "sanitize-html";

import { rgb } from "./colors";
import { isInternalHref, toAbsoluteUrl } from "./urls";
import { entries } from "./utilities";
import { siteOrigin } from "./const";

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

export const allowedTags: Array<keyof JSX.IntrinsicElements> = [
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

const colorHexRegex = new RegExp(editorColors.join("|"), "i");
const colorRgbRegex =
	/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

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
					if (alignMatch) {
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
									Number.parseInt(match[1]),
									Number.parseInt(match[2]),
									Number.parseInt(match[3])
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

import sanitizeHtml, { Attributes } from "sanitize-html";

import { isInternalHref } from "./urls";

const allowedTags: Array<keyof JSX.IntrinsicElements> = [
	"a",
	"b",
	"blockquote",
	"br",
	"em",
	"hr",
	"li",
	"p",
	"span",
	"strong",
	"ul",
	"ol",
	"u"
];

const colorHexRegex = /^#(0x)?[0-9a-f]+$/i;
const colorRgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

export function html(value: string) {
	return sanitizeHtml(value, {
		allowedTags,
		allowedAttributes: {
			"*": ["style"]
		},
		allowedStyles: {
			"*": {
				color: [colorHexRegex, colorRgbRegex],
				"background-color": [colorHexRegex, colorRgbRegex],
				"text-align": [/\w+/]
			}
		},
		allowedSchemes: ["http", "https"],
		transformTags: {
			"*": (tagName: string, attribs: Attributes) => {
				const alignMatch = attribs.class?.match(/ql-align-(\w+)/);
				if (!alignMatch) return { tagName, attribs };

				attribs.class = attribs.class.replace(alignMatch[0], "");
				attribs.style = `text-align: ${alignMatch[1]}; ${attribs.style ?? ""}`;

				return {
					tagName,
					attribs
				};
			},
			a: (tagName, attribs) => {
				if (isInternalHref(attribs.href)) return { tagName, attribs };
				return { tagName, attribs: { ...attribs, target: "_blank", rel: "noopener" } };
			}
		}
	});
}

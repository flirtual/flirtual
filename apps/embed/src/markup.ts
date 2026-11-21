import type { Allowlist } from "./allowlist";

export interface IframePlayer {
	kind: "iframe";
	src: string;
	aspectRatio?: number;
	height?: number;
	maxWidth?: number;
	/** A "name=value" query parameter that starts playback, set when the person presses play. */
	autoplay?: string;
	/** A postMessage API the app can pause the player through. */
	api?: "youtube";
	/** The player is a form to fill in, which the app's sandbox otherwise stops submitting. */
	forms?: true;
}

export interface HtmlPlayer {
	kind: "html";
	html: string;
	/** Origins the markup loads scripts from, all on the allowlist. */
	scripts: Array<string>;
	height?: number;
	maxWidth?: number;
}

export type Player = IframePlayer | HtmlPlayer;

const removed = ["base", "meta", "link", "form", "input", "button", "object", "embed", "applet", "frame", "frameset", "noscript", "template", "svg", "math"];
const urlAttributes = new Set(["href", "src", "action", "formaction", "xlink:href", "srcdoc", "data"]);

export function number(value: unknown): number | undefined {
	const parsed = typeof value === "number" ? value : typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : Number.NaN;
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function dimensions(width: unknown, height: unknown): Pick<IframePlayer, "aspectRatio" | "height"> {
	const w = number(width);
	const h = number(height);
	if (w && h) return { aspectRatio: w / h };
	return h ? { height: h } : {};
}

// Reduces oEmbed `html` to something we're willing to run in the embed frame: a single iframe, or
// markup whose scripts and iframes all come from allowlisted hosts, with inline script, event
// handlers, `javascript:` URLs and anything form- or plugin-like stripped. Anything else is no
// player at all, and the link falls back to a card.
export async function analyzeMarkup(html: string, allowlist: Allowlist): Promise<Player | null> {
	const iframes: Array<{ src: string; width: string | null; height: string | null }> = [];
	const scripts = new Set<string>();
	let elements = 0;
	let refused = false;

	const allowed = (value: string | null) => {
		if (!value) return null;
		try {
			const url = new URL(value.trim(), "https://invalid.example/");
			if (url.hostname === "invalid.example" && !value.trim().startsWith("//")) return null;
			if (url.protocol === "http:") url.protocol = "https:";
			return url.protocol === "https:" && allowlist.allows(url) ? url : null;
		}
		catch {
			return null;
		}
	};

	const rewriter = new HTMLRewriter()
		.on("*", {
			element(element) {
				elements++;
				const names = [...element.attributes].map(([name]) => name);
				for (const name of names) {
					const value = element.getAttribute(name) ?? "";
					if (name.startsWith("on") || (urlAttributes.has(name) && /^\s*(?:javascript|vbscript|data):/i.test(value)))
						element.removeAttribute(name);
				}
			}
		})
		.on(removed.join(","), { element: (element) => void element.remove() })
		.on("script", {
			element(element) {
				const src = allowed(element.getAttribute("src"));
				if (!src) {
					if (element.getAttribute("src")) refused = true;
					element.remove();
					return;
				}

				scripts.add(src.origin);
				element.setAttribute("src", src.href);
			}
		})
		.on("iframe", {
			element(element) {
				const src = allowed(element.getAttribute("src"));
				if (!src) {
					refused = true;
					element.remove();
					return;
				}

				element.setAttribute("src", src.href);
				element.removeAttribute("srcdoc");
				iframes.push({ src: src.href, width: element.getAttribute("width"), height: element.getAttribute("height") });
			}
		});

	const sanitized = await rewriter.transform(new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } })).text();
	if (refused) return null;

	if (iframes.length === 1 && scripts.size === 0 && elements <= 2) {
		const [iframe] = iframes;
		return { kind: "iframe", src: iframe.src, ...dimensions(iframe.width, iframe.height) };
	}

	if (scripts.size === 0) return null;
	return { kind: "html", html: sanitized.trim(), scripts: [...scripts] };
}

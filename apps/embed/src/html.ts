import { limit } from "./fetch";

const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " " };

// lol-html hands over attribute values and text as written, entities and all.
export function decodeEntities(value: string): string {
	return value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (match, decimal?: string, hex?: string, name?: string) => {
		if (name) return named[name.toLowerCase()] ?? match;

		const codePoint = Number.parseInt(decimal ?? hex!, decimal ? 10 : 16);
		return codePoint > 0 && codePoint <= 0x10FFFF ? String.fromCodePoint(codePoint) : match;
	});
}

export function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}

export interface Page {
	title: string | null;
	/** `<meta>` content by lowercased property or name, first occurrence wins. */
	meta: ReadonlyMap<string, string>;
	oembed: URL | null;
	refresh: URL | null;
}

const maximumPageBytes = 1024 * 1024;

export async function readPage(response: Response, base: URL): Promise<Page> {
	let title: string | null = null;
	let titleText = "";
	let inTitle = false;
	const meta = new Map<string, string>();
	let oembed: URL | null = null;
	let refresh: URL | null = null;

	const resolve = (href: string | null) => {
		if (!href) return null;
		try {
			return new URL(decodeEntities(href.trim()), base);
		}
		catch {
			return null;
		}
	};

	const rewriter = new HTMLRewriter()
		.on("head title", {
			element(element) {
				if (title !== null) return;
				inTitle = true;
				element.onEndTag(() => {
					inTitle = false;
					title = decodeEntities(titleText).replace(/\s+/g, " ").trim() || null;
				});
			},
			text(chunk) {
				if (inTitle) titleText += chunk.text;
			}
		})
		.on("meta", {
			element(element) {
				const content = element.getAttribute("content");
				if (content === null) return;

				if (element.getAttribute("http-equiv")?.toLowerCase() === "refresh") {
					const target = /url\s*=\s*['"]?([^'"]+)/i.exec(content)?.[1];
					refresh ??= resolve(target ?? null);
					return;
				}

				const key = (element.getAttribute("property") ?? element.getAttribute("name"))?.trim().toLowerCase();
				if (key && !meta.has(key)) meta.set(key, decodeEntities(content).trim());
			}
		})
		.on("link[rel]", {
			element(element) {
				const rel = element.getAttribute("rel")!.toLowerCase().split(/\s+/);
				const type = element.getAttribute("type")?.toLowerCase();
				if (rel.includes("alternate") && type === "application/json+oembed")
					oembed ??= resolve(element.getAttribute("href"));
			}
		});

	if (response.body) {
		const truncated = new Response(limit(response.body, maximumPageBytes, "truncate"), { headers: response.headers });
		await rewriter.transform(truncated).arrayBuffer();
	}

	return { title, meta, oembed, refresh };
}

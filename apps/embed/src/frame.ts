import type { Allowlist, OriginList } from "./allowlist";
import { escapeHtml } from "./html";
import type { Player } from "./markup";

// Script widgets (posts, tweets) settle on a height only once they've loaded, so the frame tells
// the app how tall its content is. A number is all it says, and the app clamps it.
const resizeScript = `(()=>{let last=0;const post=()=>{const height=Math.ceil(document.body.getBoundingClientRect().height);if(height!==last){last=height;parent.postMessage({type:"embed:resize",height},"*")}};new ResizeObserver(post).observe(document.body);addEventListener("load",post)})()`;

let resizeHash: Promise<string> | undefined;
function resizeScriptSource() {
	return resizeHash ??= crypto.subtle.digest("SHA-256", new TextEncoder().encode(resizeScript))
		.then((digest) => `'sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}'`);
}

export interface FrameOptions {
	theme: "light" | "dark";
	autoplay: boolean;
	ancestors: OriginList;
	allowlist: Allowlist;
}

const csp = (directives: Record<string, Array<string>>) =>
	Object.entries(directives).map(([name, values]) => [name, ...values].join(" ")).join("; ");

async function themed(html: string, theme: "light" | "dark") {
	if (theme === "light") return html;

	return new HTMLRewriter()
		.on("blockquote.twitter-tweet", { element: (element) => void element.setAttribute("data-theme", "dark") })
		.on("blockquote.reddit-embed-bq", { element: (element) => void element.setAttribute("data-embed-theme", "dark") })
		.transform(new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } }))
		.text();
}

export async function renderFrame(player: Player, { theme, autoplay, ancestors, allowlist }: FrameOptions): Promise<Response> {
	const common = {
		"default-src": ["'none'"],
		"base-uri": ["'none'"],
		"form-action": ["'none'"],
		"frame-ancestors": ancestors.origins.length > 0 ? ancestors.origins : ["'none'"]
	};

	let body: string;
	let style: string;
	let policy: string;

	if (player.kind === "iframe") {
		const src = new URL(player.src);
		if (autoplay && player.autoplay) {
			const [name, value] = player.autoplay.split("=");
			src.searchParams.set(name, value);
		}

		style = "html,body{margin:0;height:100%;overflow:hidden;background:transparent}iframe{display:block;width:100%;height:100%;border:0}";
		body = `<iframe src="${escapeHtml(src.href)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
		policy = csp({ ...common, "frame-src": [src.origin], "style-src": ["'unsafe-inline'"] });
	}
	else {
		// The widget's scripts add iframes and fetch from their own hosts, which we can't list in
		// advance, so those are held to the allowlist rather than to exact origins. The app's own
		// domains are on the allowlist too, but a widget has no business framing or calling them.
		const own = ancestors.domains();
		const sources = allowlist.sources().filter((source) => {
			const host = source.replace(/^https:\/\/(?:\*\.)?/, "");
			return !own.some((domain) => host === domain || host.endsWith(`.${domain}`));
		});

		style = "html,body{margin:0;overflow:hidden;background:transparent}body{display:flow-root}body>*{max-width:100%!important;margin-inline:auto!important}";
		body = `${await themed(player.html, theme)}<script>${resizeScript}</script>`;
		policy = csp({
			...common,
			"script-src": [...player.scripts, await resizeScriptSource()],
			"frame-src": sources,
			"connect-src": sources,
			"img-src": ["https:", "data:"],
			"media-src": ["https:"],
			"style-src": ["'unsafe-inline'", "https:"],
			"font-src": ["https:", "data:"]
		});
	}

	const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="${theme}"><style>${style}</style></head><body>${body}</body></html>`;

	return new Response(html, {
		headers: {
			"content-type": "text/html; charset=utf-8",
			"content-security-policy": policy,
			"permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), display-capture=()",
			"referrer-policy": "strict-origin-when-cross-origin",
			"x-content-type-options": "nosniff",
			"cache-control": "public, max-age=3600"
		}
	});
}

import { Allowlist, list, OriginList } from "./allowlist";
import { renderFrame } from "./frame";
import { proxyImage, proxyVideo } from "./proxy";
import { sign, verify } from "./sign";
import type { Unfurled, UnfurlContext } from "./unfurl";
import { unfurl } from "./unfurl";

// Bump to drop every cached unfurl when its shape or the rules change.
const cacheVersion = 1;

const ttl = { found: 86400, missing: 21600, failed: 600 };

class RateLimited extends Error {}

function parseUrl(value: string | null): URL | null {
	if (!value || value.length > 2048) return null;
	try {
		const url = new URL(value);
		url.hash = "";
		return url.protocol === "https:" || url.protocol === "http:" ? url : null;
	}
	catch {
		return null;
	}
}

function context(request: Request, env: Env): UnfurlContext & { ancestors: OriginList } {
	const origin = env.PUBLIC_ORIGIN ?? new URL(request.url).origin;
	const ancestors = new OriginList(list(env.ALLOWED_ORIGINS));

	return {
		allowlist: Allowlist.fromEnv(env.ALLOWED_HOSTS),
		ancestors,
		fetcher: (request) => fetch(request),
		userAgent: env.USER_AGENT,
		origin,
		parents: [new URL(origin).hostname, ...ancestors.hostnames()],
		sign: (purpose, url) => sign(env.SIGNING_KEY, purpose, url)
	};
}

async function cachedUnfurl(input: URL, request: Request, env: Env, executionContext: ExecutionContext): Promise<Unfurled | null> {
	const ctx = context(request, env);
	const key = new Request(`${ctx.origin}/__unfurl?v=${cacheVersion}&url=${encodeURIComponent(input.href)}`);

	const cache = caches.default;
	const hit = await cache.match(key);
	if (hit) return hit.json();

	const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
	const { success } = await env.UNFURL_LIMITER.limit({ key: ip });
	if (!success) throw new RateLimited();

	let result: Unfurled | null = null;
	let maxAge = ttl.missing;

	try {
		result = await unfurl(input, ctx);
		if (result) maxAge = ttl.found;
	}
	catch (reason) {
		// Errors can quote the link, which came from a private chat.
		console.warn("unfurl failed", input.hostname, reason instanceof Error ? reason.name : typeof reason);
		maxAge = ttl.failed;
	}

	executionContext.waitUntil(cache.put(key, Response.json(result, { headers: { "cache-control": `public, max-age=${maxAge}` } })));
	return result;
}

const apiHeaders = {
	"content-security-policy": "default-src 'none'; frame-ancestors 'none'",
	"x-content-type-options": "nosniff",
	"x-robots-tag": "noindex"
};

export default {
	async fetch(request, env, executionContext): Promise<Response> {
		const url = new URL(request.url);
		if (request.method !== "GET" && request.method !== "HEAD")
			return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });

		switch (url.pathname) {
			case "/unfurl": {
				const origin = request.headers.get("origin");
				const ancestors = new OriginList(list(env.ALLOWED_ORIGINS));
				if (!ancestors.allows(origin)) return new Response(null, { status: 403, headers: apiHeaders });

				const cors = { "access-control-allow-origin": origin, vary: "origin" };
				const input = parseUrl(url.searchParams.get("url"));
				if (!input) return Response.json({ error: "invalid_url" }, { status: 400, headers: { ...apiHeaders, ...cors } });

				try {
					const result = await cachedUnfurl(input, request, env, executionContext);
					return Response.json({ embed: result?.embed ?? null }, {
						headers: { ...apiHeaders, ...cors, "cache-control": "public, max-age=3600" }
					});
				}
				catch (reason) {
					if (reason instanceof RateLimited)
						return Response.json({ error: "rate_limited" }, { status: 429, headers: { ...apiHeaders, ...cors, "retry-after": "60" } });
					throw reason;
				}
			}
			case "/frame": {
				const input = parseUrl(url.searchParams.get("url"));
				if (!input) return new Response(null, { status: 400, headers: apiHeaders });

				const result = await cachedUnfurl(input, request, env, executionContext).catch(() => null);
				if (!result?.player) return new Response(null, { status: 404, headers: apiHeaders });

				const ctx = context(request, env);
				return renderFrame(result.player, {
					theme: url.searchParams.get("theme") === "dark" ? "dark" : "light",
					autoplay: url.searchParams.get("autoplay") === "1",
					ancestors: ctx.ancestors,
					allowlist: ctx.allowlist
				});
			}
			case "/image":
			case "/media": {
				const purpose = url.pathname.slice(1) as "image" | "media";
				const target = parseUrl(url.searchParams.get("url"));
				const signature = url.searchParams.get("s");
				if (!target || !signature || !await verify(env.SIGNING_KEY, purpose, target.href, signature))
					return new Response(null, { status: 403, headers: apiHeaders });

				const options = { fetcher: (request: Request) => fetch(request), userAgent: env.USER_AGENT };
				if (purpose === "media") return proxyVideo(target, request.headers.get("range"), options).catch(() => new Response(null, { status: 502 }));

				// The Cache API only keeps GETs, so a HEAD shares the GET's entry.
				const cache = caches.default;
				const key = new Request(request.url);
				const hit = await cache.match(key);
				if (hit) return hit;

				const response = await proxyImage(target, options).catch(() => new Response(null, { status: 502 }));
				if (response.ok) executionContext.waitUntil(cache.put(key, response.clone()));
				return response;
			}
			case "/robots.txt":
				return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });
			default:
				return new Response(null, { status: 404, headers: apiHeaders });
		}
	}
} satisfies ExportedHandler<Env>;

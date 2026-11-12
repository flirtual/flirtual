import { Allowlist } from "./allowlist";
import type { Fetcher } from "./fetch";
import { contentType, follow } from "./fetch";
import type { Page } from "./html";
import { readPage } from "./html";
import type { IframePlayer, Player } from "./markup";
import { analyzeMarkup, dimensions, number } from "./markup";
import type { OEmbed } from "./oembed";
import { fetchOEmbed, knownEndpoint, skipsPage } from "./oembed";
import type { Post } from "./posts";
import { fetchPost } from "./posts";
import { rulePlayer } from "./rules";

export interface EmbedImage {
	url: string;
	width: number | null;
	height: number | null;
}

/** The wire type, mirrored in apps/frontend/src/api/embed.ts. */
export interface Embed {
	/** Where the link ended up after redirects; always on the allowlist. */
	url: string;
	siteName: string;
	title: string | null;
	description: string | null;
	/** A preview image, proxied. */
	image: EmbedImage | null;
	/** Media to show inline instead of a card, proxied. */
	media: (EmbedImage & { type: "image" | "video"; loop: boolean }) | null;
	/** An interactive player, served from this worker's /frame. */
	player: {
		url: string;
		aspectRatio: number | null;
		height: number | null;
		maxWidth: number | null;
		/** The frame reports its content's height, as script widgets grow once they've loaded. */
		resizes: boolean;
		/** A postMessage API the app can pause the player through, inside the frame. */
		api: "youtube" | null;
		/** The player is a form to fill in, so the app lets its frame submit one. */
		forms: boolean;
	} | null;
	/** A post drawn from its data rather than the site's widget, its media proxied. */
	post: {
		author: { name: string; handle: string; avatar: string | null };
		text: string;
		createdAt: string | null;
		media: Array<{ type: "image" | "video" | "gif"; url: string; poster: string | null; width: number | null; height: number | null }>;
		sensitive: boolean;
	} | null;
}

export interface Unfurled {
	embed: Embed;
	player: Player | null;
}

export interface UnfurlContext {
	allowlist: Allowlist;
	fetcher: Fetcher;
	userAgent: string;
	/** This worker's origin, for /frame, /image and /media URLs. */
	origin: string;
	parents: Array<string>;
	sign: (purpose: "image" | "media", url: string) => Promise<string>;
}

// Klipy's terms require its media to load straight from Klipy in the person's own client, so the
// app renders those links itself and they never pass through here.
const clientOnly = new Allowlist(["klipy.com", "*.klipy.com"]);

// Hosts whose videos are GIFs: shown inline, muted and looping, rather than behind a play button.
const gifHosts = new Allowlist(["giphy.com", "*.giphy.com", "tenor.com", "*.tenor.com", "imgur.com", "*.imgur.com", "gyazo.com", "*.gyazo.com"]);

const maximumMetaRefreshes = 1;

function absolute(value: string | undefined, base: URL): URL | null {
	if (!value) return null;
	try {
		const url = new URL(value, base);
		if (url.protocol === "http:") url.protocol = "https:";
		return url.protocol === "https:" ? url : null;
	}
	catch {
		return null;
	}
}

const text = (value: string | null | undefined, length: number) => {
	const trimmed = value?.replace(/\s+/g, " ").trim();
	if (!trimmed) return null;
	return trimmed.length > length ? `${trimmed.slice(0, length - 1).trimEnd()}…` : trimmed;
};

function iframe(src: URL | null, allowlist: Allowlist, width: unknown, height: unknown): IframePlayer | null {
	if (!src || !allowlist.allows(src)) return null;
	return { kind: "iframe", src: src.href, ...dimensions(width, height) };
}

async function oembedPlayer(oembed: OEmbed | null, allowlist: Allowlist): Promise<Player | null> {
	if (!oembed?.html || (oembed.type !== "video" && oembed.type !== "rich")) return null;

	const player = await analyzeMarkup(oembed.html, allowlist);
	if (!player) return null;

	if (player.kind === "iframe" && !player.aspectRatio && !player.height)
		return { ...player, ...dimensions(oembed.width, oembed.height) };

	return player;
}

function pagePlayer(page: Page | null, base: URL, allowlist: Allowlist): IframePlayer | null {
	if (!page) return null;
	const { meta } = page;

	const twitter = iframe(absolute(meta.get("twitter:player"), base), allowlist, meta.get("twitter:player:width"), meta.get("twitter:player:height"));
	if (twitter) return twitter;

	const type = meta.get("og:video:type")?.toLowerCase();
	if (type && type !== "text/html") return null;

	const src = absolute(meta.get("og:video:secure_url") ?? meta.get("og:video:url") ?? meta.get("og:video"), base);
	if (!type && src && /\.(?:mp4|webm|mov|m4v)$/i.test(src.pathname)) return null;

	return iframe(src, allowlist, meta.get("og:video:width"), meta.get("og:video:height"));
}

function pageVideo(page: Page | null, base: URL): { url: URL; width?: number; height?: number } | null {
	if (!page) return null;
	const { meta } = page;

	const type = meta.get("og:video:type")?.toLowerCase();
	const url = absolute(meta.get("og:video:secure_url") ?? meta.get("og:video:url") ?? meta.get("og:video"), base);
	if (!url) return null;

	const video = type ? /^video\/(?:mp4|webm|quicktime)$/.test(type) : /\.(?:mp4|webm|mov|m4v)$/i.test(url.pathname);
	return video ? { url, width: number(meta.get("og:video:width")), height: number(meta.get("og:video:height")) } : null;
}

async function postEmbed(post: Post, proxied: (purpose: "image" | "media", target: URL) => Promise<string>): Promise<Embed> {
	return {
		url: post.url.href,
		siteName: post.site,
		title: post.author.name,
		description: text(post.text, 300),
		image: null,
		media: null,
		player: null,
		post: {
			author: {
				name: post.author.name,
				handle: post.author.handle,
				avatar: post.author.avatar && await proxied("image", post.author.avatar)
			},
			text: post.text,
			createdAt: post.createdAt,
			media: await Promise.all(post.media.slice(0, 4).map(async ({ type, url, poster, width, height }) => ({
				type,
				url: await proxied(type === "image" ? "image" : "media", url),
				poster: poster && await proxied("image", poster),
				width,
				height
			}))),
			sensitive: post.sensitive
		}
	};
}

export async function unfurl(input: URL, context: UnfurlContext, refreshes = 0): Promise<Unfurled | null> {
	const { allowlist, fetcher, userAgent, origin, sign } = context;
	if (!allowlist.allows(input) || clientOnly.allows(input)) return null;

	const headers = {
		"user-agent": userAgent,
		accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
		"accept-language": "en;q=0.9,*;q=0.5"
	};

	let url = input;
	let page: Page | null = null;

	const proxied = async (purpose: "image" | "media", target: URL) =>
		`${origin}/${purpose}?url=${encodeURIComponent(target.href)}&s=${await sign(purpose, target.href)}`;

	const post = await fetchPost(input, { fetcher, userAgent }).catch(() => null);
	if (post) return { embed: await postEmbed(post, proxied), player: null };

	if (!skipsPage(input)) {
		const followed = await follow(input, { fetcher, headers, stopAt: (hop) => clientOnly.allows(hop) });
		const { response } = followed;
		url = followed.url;

		// The allowlist is applied again where the link actually ends up: a shortener or open
		// redirect on an allowed site must not lead to an embed of anywhere else. An exception
		// names one exact link, so where that link goes was approved along with it.
		if (!response || !(allowlist.allows(url) || allowlist.excepts(input)) || !response.ok) {
			await response?.body?.cancel();
			return null;
		}

		const type = contentType(response);
		if (/^image\/(?:jpeg|png|gif|webp|avif)$/.test(type) || /^video\/(?:mp4|webm|quicktime)$/.test(type)) {
			await response.body?.cancel();
			const video = type.startsWith("video/");

			return {
				embed: {
					url: url.href,
					siteName: url.hostname.replace(/^www\./, ""),
					title: null,
					description: null,
					image: null,
					media: {
						type: video ? "video" : "image",
						url: await proxied(video ? "media" : "image", url),
						width: null,
						height: null,
						loop: type === "image/gif" || (video && gifHosts.allows(url))
					},
					player: null,
					post: null
				},
				player: null
			};
		}

		if (type !== "text/html" && type !== "application/xhtml+xml") {
			await response.body?.cancel();
			return null;
		}

		page = await readPage(response, url);

		if (page.refresh && !page.meta.has("og:title") && refreshes < maximumMetaRefreshes)
			return unfurl(page.refresh, context, refreshes + 1);
	}

	const endpoint = knownEndpoint(url) ?? page?.oembed ?? null;
	const oembed = endpoint ? await fetchOEmbed(endpoint, { fetcher, userAgent }).catch(() => null) : null;

	// 1. Domain rules, 2. oEmbed, 3. twitter:player / og:video.
	let player = rulePlayer(url, context)
		?? await oembedPlayer(oembed, allowlist)
		?? pagePlayer(page, url, allowlist);

	let media: Embed["media"] = null;
	const video = pageVideo(page, url);

	if (video && (!player || gifHosts.allows(url))) {
		player = null;
		media = {
			type: "video",
			url: await proxied("media", video.url),
			width: video.width ?? null,
			height: video.height ?? null,
			loop: gifHosts.allows(url)
		};
	}
	else if (!player && oembed?.type === "photo") {
		const photo = absolute(oembed.url, url);
		if (photo) {
			media = {
				type: "image",
				url: await proxied("image", photo),
				width: number(oembed.width) ?? null,
				height: number(oembed.height) ?? null,
				loop: /\.gif$/i.test(photo.pathname)
			};
		}
	}

	// 4. The OpenGraph card, which also fronts a player until someone presses play.
	const meta = page?.meta ?? new Map<string, string>();
	const imageUrl = absolute(meta.get("og:image:secure_url") ?? meta.get("og:image") ?? meta.get("og:image:url") ?? meta.get("twitter:image") ?? meta.get("twitter:image:src"), url);
	const image = imageUrl
		? { url: imageUrl, width: number(meta.get("og:image:width")), height: number(meta.get("og:image:height")) }
		: (() => {
				const thumbnail = absolute(oembed?.thumbnail_url, url);
				return thumbnail && { url: thumbnail, width: number(oembed?.thumbnail_width), height: number(oembed?.thumbnail_height) };
			})();

	const title = text(meta.get("og:title") ?? oembed?.title ?? meta.get("twitter:title") ?? page?.title ?? oembed?.author_name, 200);
	const description = text(meta.get("og:description") ?? meta.get("twitter:description") ?? meta.get("description"), 300);

	// A bare <title> is often just the site's name (an interstitial, a login wall), not worth a card.
	if (!player && !media && !image && !description) return null;

	const playerUrl = new URL("/frame", origin);
	playerUrl.searchParams.set("url", input.href);

	return {
		embed: {
			url: url.href,
			siteName: text(meta.get("og:site_name") ?? oembed?.provider_name, 60) ?? url.hostname.replace(/^www\./, ""),
			title,
			description,
			image: image ? { url: await proxied("image", image.url), width: image.width ?? null, height: image.height ?? null } : null,
			media,
			player: player && {
				url: playerUrl.href,
				aspectRatio: player.kind === "iframe" ? player.aspectRatio ?? null : null,
				height: player.height ?? (player.kind === "html" ? 320 : null),
				maxWidth: player.maxWidth ?? (player.kind === "html" ? 550 : null),
				resizes: player.kind === "html",
				api: player.kind === "iframe" ? player.api ?? null : null,
				forms: player.kind === "iframe" && !!player.forms
			},
			post: null
		},
		player
	};
}

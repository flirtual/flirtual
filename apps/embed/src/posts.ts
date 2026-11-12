// Posts on X and Bluesky are drawn by the app from their data, so the text shows before anyone
// presses play and neither site's widget scripts run. X's is the syndication endpoint behind its
// own embeds (as Vercel's react-tweet uses); Bluesky's is its public AppView.

import type { Fetcher } from "./fetch";
import { fetchable, readJson } from "./fetch";
import { decodeEntities } from "./html";
import { number } from "./markup";

export interface PostMedia {
	type: "image" | "video" | "gif";
	url: URL;
	/** A still for a video, or a Bluesky video's only image: its stream can't play in a <video>. */
	poster: URL | null;
	width: number | null;
	height: number | null;
}

export interface Post {
	site: "X" | "Bluesky";
	url: URL;
	author: { name: string; handle: string; avatar: URL | null };
	text: string;
	createdAt: string | null;
	media: Array<PostMedia>;
	/** Media the site itself marks sensitive, left out. */
	sensitive: boolean;
}

interface PostOptions {
	fetcher: Fetcher;
	userAgent: string;
}

const xPost = /^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/(?:#!\/)?\w+\/status(?:es)?\/(\d+)/i;
const blueskyPost = /^https?:\/\/(?:www\.)?bsky\.app\/profile\/([\w.:-]+)\/post\/([a-z0-9]+)/i;

const maximumText = 1000;

function https(value: unknown): URL | null {
	if (typeof value !== "string") return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" && fetchable(url) ? url : null;
	}
	catch {
		return null;
	}
}

async function getJson(url: URL, { fetcher, userAgent }: PostOptions): Promise<any> {
	const response = await fetcher(new Request(url, { headers: { "user-agent": userAgent, accept: "application/json" }, signal: AbortSignal.timeout(8000) }));
	if (!response.ok) {
		await response.body?.cancel();
		return null;
	}
	return readJson(response, 512 * 1024);
}

// The token X's own embed script sends: https://github.com/vercel/react-tweet/blob/main/packages/react-tweet/src/api/fetch-tweet.ts
function syndicationToken(id: string) {
	return ((Number(id) / 1e15) * Math.PI).toString(6 ** 2).replace(/(?:0+|\.)/g, "");
}

async function fetchX(id: string, url: URL, options: PostOptions): Promise<Post | null> {
	const api = new URL("https://cdn.syndication.twimg.com/tweet-result");
	api.searchParams.set("id", id);
	api.searchParams.set("lang", "en");
	api.searchParams.set("token", syndicationToken(id));

	const tweet = await getJson(api, options);
	if (tweet?.__typename !== "Tweet" || typeof tweet.text !== "string") return null;

	// The range leaves off the trailing link to the post's own media.
	const [start, end] = Array.isArray(tweet.display_text_range) ? tweet.display_text_range : [0, undefined];
	let text = Array.from(tweet.text as string).slice(start, end).join("");
	for (const link of tweet.entities?.urls ?? [])
		if (typeof link?.url === "string" && typeof link.display_url === "string") text = text.replaceAll(link.url, link.display_url);

	const sensitive = tweet.possibly_sensitive === true;
	const media: Array<PostMedia> = [];
	for (const item of sensitive ? [] : tweet.mediaDetails ?? []) {
		const still = https(item?.media_url_https);
		const width = number(item?.original_info?.width) ?? null;
		const height = number(item?.original_info?.height) ?? null;

		if (item?.type === "photo" && still) {
			media.push({ type: "image", url: still, poster: null, width, height });
			continue;
		}

		const mp4 = ((item?.video_info?.variants ?? []) as Array<{ content_type?: string; bitrate?: number; url?: string }>)
			.filter((variant) => variant.content_type === "video/mp4")
			.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];
		const video = https(mp4?.url);
		if (video) media.push({ type: item.type === "animated_gif" ? "gif" : "video", url: video, poster: still, width, height });
	}

	const user = tweet.user ?? {};
	return {
		site: "X",
		url,
		author: {
			name: String(user.name ?? user.screen_name ?? ""),
			handle: String(user.screen_name ?? ""),
			avatar: https(typeof user.profile_image_url_https === "string" ? user.profile_image_url_https.replace("_normal.", "_bigger.") : null)
		},
		text: decodeEntities(text).trim().slice(0, maximumText),
		createdAt: typeof tweet.created_at === "string" ? tweet.created_at : null,
		media,
		sensitive
	};
}

// Labels Bluesky's own moderation puts on media it hides behind a warning.
const sensitiveLabels = new Set(["porn", "sexual", "nudity", "graphic-media", "gore"]);

function blueskyMedia(embed: any): Array<PostMedia> {
	switch (embed?.$type) {
		case "app.bsky.embed.images#view":
			return (embed.images ?? []).flatMap((image: any) => {
				const url = https(image?.fullsize) ?? https(image?.thumb);
				return url ? [{ type: "image" as const, url, poster: null, width: number(image.aspectRatio?.width) ?? null, height: number(image.aspectRatio?.height) ?? null }] : [];
			});
		case "app.bsky.embed.video#view": {
			const poster = https(embed.thumbnail);
			return poster ? [{ type: "image" as const, url: poster, poster, width: number(embed.aspectRatio?.width) ?? null, height: number(embed.aspectRatio?.height) ?? null }] : [];
		}
		case "app.bsky.embed.recordWithMedia#view":
			return blueskyMedia(embed.media);
		default:
			return [];
	}
}

async function fetchBluesky(actor: string, key: string, url: URL, options: PostOptions): Promise<Post | null> {
	const api = new URL("https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread");
	api.searchParams.set("uri", `at://${actor}/app.bsky.feed.post/${key}`);
	api.searchParams.set("depth", "0");
	api.searchParams.set("parentHeight", "0");

	const post = (await getJson(api, options))?.thread?.post;
	if (!post || typeof post.record?.text !== "string") return null;

	const labels = [...post.labels ?? [], ...post.author?.labels ?? []].map((label: any) => label?.val);
	const sensitive = labels.some((label) => sensitiveLabels.has(label));

	return {
		site: "Bluesky",
		url,
		author: {
			name: String(post.author?.displayName || post.author?.handle || ""),
			handle: String(post.author?.handle ?? ""),
			avatar: https(post.author?.avatar)
		},
		text: (post.record.text as string).trim().slice(0, maximumText),
		createdAt: typeof post.record.createdAt === "string" ? post.record.createdAt : null,
		media: sensitive ? [] : blueskyMedia(post.embed),
		sensitive
	};
}

export async function fetchPost(url: URL, options: PostOptions): Promise<Post | null> {
	const x = xPost.exec(url.href);
	if (x) return fetchX(x[1], url, options);

	const bluesky = blueskyPost.exec(url.href);
	if (bluesky) return fetchBluesky(bluesky[1], bluesky[2], url, options);

	return null;
}

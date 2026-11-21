import type { Fetcher } from "./fetch";
import { contentType, fetchable, follow, readJson } from "./fetch";

export interface OEmbed {
	type: "photo" | "video" | "link" | "rich";
	title?: string;
	author_name?: string;
	provider_name?: string;
	thumbnail_url?: string;
	thumbnail_width?: number | string;
	thumbnail_height?: number | string;
	url?: string;
	html?: string;
	width?: number | string | null;
	height?: number | string | null;
}

interface Provider {
	re: RegExp;
	endpoint: string;
	/**
	 * The page itself has nothing the endpoint doesn't, or isn't served to us at all (a consent or
	 * bot wall), so skip fetching it. Only for URLs that can't redirect anywhere unexpected.
	 */
	skipPage?: boolean;
	url?: (url: URL) => string;
}

// From https://oembed.com/providers.json, for allowlisted sites that don't advertise their
// endpoint with discovery, or that do but don't serve their pages to us.
const providers: Array<Provider> = [
	{
		re: /^https:\/\/(?:(?:www|m|music)\.)?youtube\.com\/(?:watch|shorts\/|live\/|playlist)|^https:\/\/youtu\.be\//,
		endpoint: "https://www.youtube.com/oembed?format=json",
		skipPage: true
	},
	{
		re: /^https:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/\w+\/status(?:es)?\/\d+/,
		endpoint: "https://publish.twitter.com/oembed?dnt=true&omit_script=false",
		skipPage: true,
		url: (url) => `https://twitter.com${url.pathname}`
	},
	{
		re: /^https:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
		endpoint: "https://www.tiktok.com/oembed",
		skipPage: true
	},
	{ re: /^https:\/\/(?:www\.|old\.|new\.)?reddit\.com\/r\/\w+\/comments\//, endpoint: "https://www.reddit.com/oembed" },
	{ re: /^https:\/\/bsky\.app\/profile\/[^/]+\/post\//, endpoint: "https://embed.bsky.app/oembed" },
	{ re: /^https:\/\/(?:open|play)\.spotify\.com\//, endpoint: "https://open.spotify.com/oembed" },
	{ re: /^https:\/\/(?:www\.|m\.)?soundcloud\.com\//, endpoint: "https://soundcloud.com/oembed?format=json" },
	{ re: /^https:\/\/(?:www\.|player\.)?vimeo\.com\//, endpoint: "https://vimeo.com/api/oembed.json" },
	{ re: /^https:\/\/(?:www\.)?dailymotion\.com\/video\//, endpoint: "https://www.dailymotion.com/services/oembed?format=json" },
	{ re: /^https:\/\/(?:www\.)?mixcloud\.com\//, endpoint: "https://app.mixcloud.com/oembed/?format=json" },
	{ re: /^https:\/\/(?:www\.)?giphy\.com\/(?:gifs|clips|stickers)\//, endpoint: "https://giphy.com/services/oembed" },
	{ re: /^https:\/\/sketchfab\.com\/(?:3d-)?models\//, endpoint: "https://sketchfab.com/oembed" }
];

const find = (url: URL) => providers.find(({ re }) => re.test(url.href));

export function skipsPage(url: URL): boolean {
	return !!find(url)?.skipPage;
}

export function knownEndpoint(url: URL): URL | null {
	const provider = find(url);
	if (!provider) return null;

	const endpoint = new URL(provider.endpoint);
	endpoint.searchParams.set("url", provider.url?.(url) ?? url.href);
	return endpoint;
}

export interface OEmbedOptions {
	fetcher: Fetcher;
	userAgent: string;
}

export async function fetchOEmbed(endpoint: URL, { fetcher, userAgent }: OEmbedOptions): Promise<OEmbed | null> {
	if (!fetchable(endpoint)) return null;

	const { response } = await follow(endpoint, {
		fetcher,
		headers: { "user-agent": userAgent, accept: "application/json" },
		timeout: 6000
	});

	if (!response.ok || !/json|javascript|text\/plain/.test(contentType(response))) {
		await response.body?.cancel();
		return null;
	}

	const data = await readJson(response, 256 * 1024).catch(() => null);
	if (!data || typeof data !== "object") return null;

	const oembed = data as Partial<OEmbed>;
	if (!oembed.type || !["photo", "video", "link", "rich"].includes(oembed.type)) return null;

	return oembed as OEmbed;
}

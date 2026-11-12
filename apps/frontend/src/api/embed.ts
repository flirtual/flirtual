import { useQuery } from "@tanstack/react-query";
import ms from "ms" with { type: "macro" };

import { deepLinkOrigins, embedOrigin, siteOrigin } from "~/const";
import { queryClient } from "~/query";

export interface EmbedImage {
	url: string;
	width: number | null;
	height: number | null;
}

/** Mirrors `Embed` in apps/embed/src/unfurl.ts. */
export interface Embed {
	url: string;
	siteName: string;
	title: string | null;
	description: string | null;
	image: EmbedImage | null;
	media: ({ type: "image" | "video"; loop: boolean } & EmbedImage) | null;
	player: {
		url: string;
		aspectRatio: number | null;
		height: number | null;
		maxWidth: number | null;
		resizes: boolean;
	} | null;
	post: {
		author: { name: string; handle: string; avatar: string | null };
		text: string;
		createdAt: string | null;
		media: Array<{ type: "gif" | "image" | "video"; url: string; poster: string | null; width: number | null; height: number | null }>;
		sensitive: boolean;
	} | null;
}

// Klipy's terms require its media to load from Klipy, in the person's own client.
export function isKlipyMedia(url: string): boolean {
	try {
		const { protocol, hostname } = new URL(url);
		return protocol === "https:" && /^static\d*\.klipy\.com$/.test(hostname);
	}
	catch {
		return false;
	}
}

const ownHosts = new Set([siteOrigin, ...deepLinkOrigins].map((origin) => new URL(origin).host));

export function isEmbeddable(url: string): boolean {
	try {
		const { protocol, host } = new URL(url);
		return (protocol === "https:" || protocol === "http:") && !ownHosts.has(host) && (!!embedOrigin || isKlipyMedia(url));
	}
	catch {
		return false;
	}
}

async function fetchEmbed(url: string, signal: AbortSignal): Promise<Embed | null> {
	const response = await fetch(`${embedOrigin}/unfurl?url=${encodeURIComponent(url)}`, { credentials: "omit", signal });
	if (!response.ok) throw new Error(`Embed lookup failed: ${response.status}`);

	const { embed } = await response.json() as { embed: Embed | null };
	return embed;
}

// Doesn't suspend: a message renders its text straight away and its embeds when they arrive.
export function useEmbed(url: string | null): Embed | null | undefined {
	const enabled = !!url && !!embedOrigin && !isKlipyMedia(url);

	const { data } = useQuery({
		queryKey: ["embed", url],
		queryFn: ({ signal }) => fetchEmbed(url!, signal),
		enabled,
		staleTime: ms("1h"),
		gcTime: ms("1h"),
		retry: false,
		throwOnError: false
	}, queryClient);

	return enabled ? data : null;
}

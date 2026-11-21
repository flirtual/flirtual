// https://docs.klipy.com/gifs-api. Klipy's integration requirements have the person's own client
// call the API and load the media, with results shown in the order and composition returned.
// https://docs.klipy.com/integration-requirements

import { klipyAppKey } from "~/const";

export interface KlipyFile {
	url: string;
	width: number;
	height: number;
	size: number;
}

type KlipyFormats = Partial<Record<"gif" | "jpg" | "mp4" | "webm" | "webp", KlipyFile>>;

export interface KlipyGif {
	id: number;
	slug: string;
	title: string;
	type: string;
	file?: Partial<Record<"hd" | "md" | "sm" | "xs", KlipyFormats>>;
	blur_preview?: string;
}

export interface KlipyPage {
	data: Array<KlipyGif>;
	current_page: number;
	per_page: number;
	has_next: boolean;
}

export interface KlipyCategory {
	category: string;
	query: string;
	preview_url: string;
}

const base = () => `https://api.klipy.com/api/v1/${klipyAppKey}/gifs`;

export interface KlipyOptions {
	/** A stable, anonymous id for the person: never their user id itself. */
	customerId: string;
	/** ISO 639-1, as in the app's locale. */
	language: string;
	/** ISO 3166-1 alpha-2, from the person's profile. */
	country?: string;
}

export type KlipySource
	= | { kind: "recent" }
		| { kind: "search"; query: string }
		| { kind: "trending" };

async function klipyGet<T>(url: URL, signal?: AbortSignal): Promise<T> {
	const response = await fetch(url, { credentials: "omit", signal });
	if (!response.ok) throw new Error(`Klipy responded ${response.status}`);

	const { data } = await response.json() as { data: T };
	return data;
}

export async function klipyGifs(source: KlipySource, page: number, perPage: number, { customerId, country }: KlipyOptions, signal?: AbortSignal): Promise<KlipyPage> {
	const url = new URL(source.kind === "recent"
		? `${base()}/recent/${encodeURIComponent(customerId)}`
		: `${base()}/${source.kind}`);
	url.searchParams.set("page", String(page));
	url.searchParams.set("per_page", String(perPage));

	if (source.kind !== "recent") {
		url.searchParams.set("customer_id", customerId);
		url.searchParams.set("content_filter", "medium");
		// Search and trending take a country here, and categories a language and country.
		if (country) url.searchParams.set("locale", country.toLowerCase());
	}
	if (source.kind === "search") url.searchParams.set("q", source.query);

	return klipyGet<KlipyPage>(url, signal);
}

export async function klipyCategories({ language, country }: KlipyOptions, signal?: AbortSignal): Promise<Array<KlipyCategory>> {
	const url = new URL(`${base()}/categories`);
	if (country) url.searchParams.set("locale", `${language}_${country.toUpperCase()}`);

	const { categories } = await klipyGet<{ categories: Array<KlipyCategory> }>(url, signal);
	return categories;
}

export async function shareKlipyGif(slug: string, query: string, { customerId }: Pick<KlipyOptions, "customerId">): Promise<void> {
	await fetch(`${base()}/share/${encodeURIComponent(slug)}`, {
		method: "POST",
		credentials: "omit",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ customer_id: customerId, q: query })
	});
}

// What goes in the message: animated WebP at Klipy's medium size, falling back through the rest.
export function klipyMessageFile(gif: KlipyGif): KlipyFile | undefined {
	const { md, sm, hd } = gif.file ?? {};
	return md?.webp ?? md?.gif ?? sm?.webp ?? sm?.gif ?? hd?.webp ?? hd?.gif;
}

export function klipyPreviewFile(gif: KlipyGif): KlipyFile | undefined {
	const { sm, xs, md } = gif.file ?? {};
	return sm?.webp ?? sm?.gif ?? xs?.webp ?? xs?.gif ?? md?.webp ?? md?.gif;
}

const customerIds = new Map<string, Promise<string>>();

export function klipyCustomerId(userId: string): Promise<string> {
	let id = customerIds.get(userId);
	if (!id) {
		id = crypto.subtle.digest("SHA-256", new TextEncoder().encode(`klipy:${userId}`))
			.then((digest) => [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join(""));
		customerIds.set(userId, id);
	}
	return id;
}

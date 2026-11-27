import { queryOptions } from "@tanstack/react-query";
import ms from "ms" with { type: "macro" };
import type { WretchOptions } from "wretch";

import { development } from "~/const";
import type { Expand } from "~/utilities";

import { api } from "./common";

// Types only, so none of the data is bundled.
interface DataFiles {
	"ban-reasons": typeof import("@flirtual/data/ban-reasons");
	countries: typeof import("@flirtual/data/countries");
	"delete-reasons": typeof import("@flirtual/data/delete-reasons");
	games: typeof import("@flirtual/data/games");
	genders: typeof import("@flirtual/data/genders");
	interests: typeof import("@flirtual/data/interests");
	"interest-categories": typeof import("@flirtual/data/interest-categories");
	kinks: typeof import("@flirtual/data/kinks");
	languages: typeof import("@flirtual/data/languages");
	platforms: typeof import("@flirtual/data/platforms");
	prompts: typeof import("@flirtual/data/prompts");
	relationships: typeof import("@flirtual/data/relationships");
	"report-reasons": typeof import("@flirtual/data/report-reasons");
	sexualities: typeof import("@flirtual/data/sexualities");
	"warn-reasons": typeof import("@flirtual/data/warn-reasons");
}

export type DataType = keyof DataFiles;

// The English overlays hold every text field an entry can have.
type Overlays
	= | typeof import("@flirtual/data/ban-reasons.en")
		| typeof import("@flirtual/data/delete-reasons.en")
		| typeof import("@flirtual/data/games.en")
		| typeof import("@flirtual/data/genders.en")
		| typeof import("@flirtual/data/interest-categories.en")
		| typeof import("@flirtual/data/interests.en")
		| typeof import("@flirtual/data/kinks.en")
		| typeof import("@flirtual/data/languages.en")
		| typeof import("@flirtual/data/platforms.en")
		| typeof import("@flirtual/data/prompts.en")
		| typeof import("@flirtual/data/relationships.en")
		| typeof import("@flirtual/data/report-reasons.en")
		| typeof import("@flirtual/data/sexualities.en")
		| typeof import("@flirtual/data/warn-reasons.en");

type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
	? `${Head}${Capitalize<CamelCase<Tail>>}`
	: S;

type KeysOf<U> = U extends unknown ? keyof U : never;
type ValueAt<U, K extends PropertyKey> = U extends Record<K, infer V> ? V : never;

type Merged<U> = Expand<
	{ [K in Exclude<keyof U, "internal"> as CamelCase<K & string>]: U[K] }
	& { [K in Exclude<KeysOf<U>, "internal" | keyof U> as CamelCase<K & string>]?: ValueAt<U, K> }
>;

type EntryOf<File> = Merged<File[keyof File]>;

export type DataText = { id: string; name: string } & Partial<EntryOf<Overlays>>;

export type DataEntry<T extends DataType> = T extends DataType
	? Expand<{ id: string } & EntryOf<DataFiles[T]> & (T extends "countries" ? unknown : DataText)>
	: never;

type OrderKey<T extends DataType> = "curated" | "name" | (T extends "games" ? "popularity" : never);

export type DataOrder<T extends DataType = DataType> = ReadonlyArray<`-${OrderKey<T>}` | OrderKey<T>>;

export function defaultOrder<T extends DataType>(type: T): DataOrder<T> {
	return (type === "games" ? ["curated", "-popularity", "name"] : ["curated", "name"]) as DataOrder<T>;
}

export const Data = {
	list<T extends DataType>(type: T, locale: string, order: DataOrder<T> = defaultOrder(type), options: WretchOptions = {}): Promise<Array<DataEntry<T>>> {
		return api
			.url(type)
			.query({ locale, order: order.join(",") })
			.options({ credentials: development ? "include" : "omit", ...options })
			.get()
			.json<Array<DataEntry<T>>>();
	}
};

function options<T extends DataType>(type: T) {
	return ({ locale, order = defaultOrder(type) }: { locale: string; order?: DataOrder<T> }) => queryOptions({
		queryKey: ["data", type, locale, order] as const,
		queryFn: ({ signal }) => Data.list(type, locale, order, { signal }),
		staleTime: ms("1d")
	});
}

export const banReasonsOptions = options("ban-reasons");
export const countriesOptions = options("countries");
export const deleteReasonsOptions = options("delete-reasons");
export const gamesOptions = options("games");
export const gendersOptions = options("genders");
export const interestCategoriesOptions = options("interest-categories");
export const interestsOptions = options("interests");
export const kinksOptions = options("kinks");
export const languagesOptions = options("languages");
export const platformsOptions = options("platforms");
export const promptsOptions = options("prompts");
export const relationshipsOptions = options("relationships");
export const reportReasonsOptions = options("report-reasons");
export const sexualitiesOptions = options("sexualities");
export const warnReasonsOptions = options("warn-reasons");

export function byId<T extends { id: string }>(entries: Array<T>): Partial<Record<string, T>> {
	return Object.fromEntries(entries.map((entry) => [entry.id, entry]));
}

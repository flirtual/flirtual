import { gitCommitSha } from "~/const";

import { fetch, type NarrowFetchOptions } from "./exports";

import type { UuidModel } from "./common";

export type KinkAttributeKind = "dominant" | "submissive" | null;

export interface AttributeMetadata {
	gender: {
		simple?: boolean;
		fallback?: boolean;
		plural?: string;
		conflicts?: Array<string>;
		aliasOf?: string;
		definition?: string;
		definitionLink: string;
	};
	sexuality: {
		definition?: string;
		definitionLink: string;
	};
	relationship: undefined;
	language: undefined;
	game: undefined;
	interest: {
		category: string;
		strength?: number;
		synonyms?: Array<string>;
	};
	platform: undefined;
	country: {
		flagUrl: string;
	};
	kink: {
		kind: KinkAttributeKind;
		pair: string;
		definition?: string;
		definitionLink: string;
	};
	prompt: undefined;
	"report-reason": {
		fallback?: boolean;
	};
	"ban-reason": {
		details: string;
		fallback?: boolean;
	};
	"delete-reason": {
		fallback?: boolean;
	};
}

export type AttributeType = keyof AttributeMetadata;

export type Attribute<T = unknown> = UuidModel & {
	type: keyof AttributeMetadata;
	name: string;
	order?: number;
	metadata: T;
};

export type PartialAttribute = Pick<Attribute<unknown>, "id" | "type">;

export type AttributeCollection<T extends string> = Array<
	Attribute<T extends AttributeType ? AttributeMetadata[T] : unknown>
>;

export type PartialAttributeCollection = Array<PartialAttribute>;

export async function list<T extends string>(
	type: T,
	options: NarrowFetchOptions = {}
): Promise<AttributeCollection<T>> {
	return fetch<AttributeCollection<T>>(
		"get",
		`attributes/${type}?v=${gitCommitSha}`,
		options
	);
}

export async function get<T extends string>(
	type: T,
	id: string,
	options: NarrowFetchOptions = {}
): Promise<Attribute<T>> {
	return fetch<Attribute<T>>("get", `attributes/${type}/${id}`, options);
}

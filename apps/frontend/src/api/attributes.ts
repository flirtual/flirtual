import { gitCommitSha } from "~/const";
import { cache } from "~/cache";

import { api } from "./common";

import type { Expand } from "~/utilities";

export type KinkAttributeKind = "dominant" | "submissive" | null;

export const attributeTypes = [
	"kink",
	"delete-reason",
	"gender",
	"interest",
	"interest-category",
	"ban-reason",
	"report-reason",
	"prompt",
	"platform",
	"relationship",
	"language",
	"country",
	"game",
	"sexuality"
] as const;

export type AttributeType = (typeof attributeTypes)[number];

export interface AttributeMetadata {
	gender: {
		simple?: boolean;
		fallback?: boolean;
		// plural?: string;
		conflicts?: Array<string>;
		aliasOf?: string;
		// definition?: string;
		definitionLink: string;
	};
	sexuality: {
		// definition?: string;
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
	"interest-category": undefined;
	platform: undefined;
	country: undefined;
	kink: {
		kind: KinkAttributeKind;
		pair: string;
		// definition?: string;
		definitionLink: string;
	};
	prompt: undefined;
	"report-reason"?: {
		fallback?: boolean;
	};
	"ban-reason": {
		//details: string;
		fallback?: boolean;
	};
	"delete-reason"?: {
		fallback?: boolean;
	};
}

export type Attribute<T = unknown> = {
	id: string;
	type: keyof AttributeMetadata;
	// name: string;
	// order?: number;
} & T;

// export type PartialAttribute = Pick<Attribute<unknown>, "id" | "type">;

export type MinimalAttribute<T extends AttributeType> =
	AttributeMetadata[T] extends infer A
		? A extends undefined
			? string
			: Expand<Omit<Attribute<AttributeMetadata[T]>, "type">>
		: never;

export type AttributeCollection<T extends AttributeType> = Array<
	MinimalAttribute<T>
>;

export type GroupedAttributeCollection = Record<
	AttributeType,
	Array<string> | undefined
>;

// export type PartialAttributeCollection = Array<PartialAttribute>;

export const Attribute = {
	api: api.url("attributes"),
	list<T extends AttributeType>(type: T) {
		return cache.global(
			() =>
				this.api
					.url(`/${type}`)
					.query({ v: gitCommitSha })
					.options({ credentials: "omit" })
					.get()
					.json<AttributeCollection<T>>(),
			{ key: [type, gitCommitSha], revalidate: false }
		);
	},
	async get<T extends AttributeType>(type: T, id: string) {
		const values = await this.list(type);
		return values.find((value) => value.id === id) ?? null;
	}
};

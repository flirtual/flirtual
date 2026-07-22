import type { WretchOptions } from "wretch";

import { development } from "~/const";
import type { Expand } from "~/utilities";

import { api } from "./common";

export type KinkAttributeKind = "dominant" | "submissive" | null;

export const attributeTypes = [
	"ban-reason",
	"country",
	"delete-reason",
	"game",
	"gender",
	"interest",
	"interest-category",
	"kink",
	"language",
	"platform",
	"prompt",
	"relationship",
	"report-reason",
	"sexuality",
	"warn-reason",
	"timezone"
] as const;

export type AttributeType = (typeof attributeTypes)[number];

// Mirrors static_types in Flirtual.Attribute.
export const editableAttributeTypes = attributeTypes
	.filter((type) => !["country", "language", "relationship", "timezone"].includes(type));

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
	sexuality?: {
		// definition?: string;
		definitionLink?: string;
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
	platform: {
		kind?: "accessory" | "headset";
	};
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
	"ban-reason"?: {
		fallback?: boolean;
	};
	"delete-reason"?: {
		fallback?: boolean;
	};
	"warn-reason"?: {
		fallback?: boolean;
		shadowban?: boolean;
	};
	timezone: {
		offset: number;
	};
}

export type Attribute<T = unknown> = {
	id: string;
	type: keyof AttributeMetadata;
	// name: string;
	// order?: number;
} & T;

// export type PartialAttribute = Pick<Attribute<unknown>, "id" | "type">;

export type MinimalAttribute<T extends AttributeType>
	= AttributeMetadata[T] extends infer A
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

// Attribute as stored, including extra fields for admins.
export interface AttributeRow {
	id: string;
	type: AttributeType;
	order: number | null;
	metadata: Record<string, unknown> | null;
	updatedAt: string;
}

export interface CreateAttributeOptions {
	id?: string;
	type: AttributeType;
	order?: number | null;
	metadata?: Record<string, unknown> | null;
}

export type UpdateAttributeOptions = Pick<CreateAttributeOptions, "metadata" | "order">;

export const Attribute = {
	api: api
		.url("attributes")
		.options({ credentials: development ? "include" : "omit" }),
	// Reads drop credentials so they stay cacheable; the admin writes need the session.
	adminApi: api.url("attributes"),
	list<T extends AttributeType>(type: T, version?: string, options: WretchOptions = {}) {
		return this.api
			.url(`/${type}`)
			.query(version ? { v: version } : {})
			.options(options)
			.get()
			.json<AttributeCollection<T>>();
	},
	async get<T extends AttributeType>(type: T, id: string) {
		const values = await this.list(type);
		return values.find((value) => value.id === id) ?? null;
	},
	listAll(type: AttributeType, options: WretchOptions = {}) {
		return this.adminApi
			.query({ type })
			.options(options)
			.get()
			.json<Array<AttributeRow>>();
	},
	create(options: CreateAttributeOptions) {
		return this.adminApi.json(options).post().json<AttributeRow>();
	},
	update(attributeId: string, options: UpdateAttributeOptions) {
		return this.adminApi
			.url(`/${attributeId}`)
			.json(options)
			.patch()
			.json<AttributeRow>();
	},
	delete(attributeId: string) {
		return this.adminApi
			.url(`/${attributeId}`)
			.delete()
			.json<{ deleted: boolean }>();
	}
};

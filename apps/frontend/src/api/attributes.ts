import { gitCommitSha } from "~/const";
import { cache } from "~/cache";

import { api, type UuidModel } from "./common";

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

import { UuidModel } from "./common";
import { fetch, NarrowFetchOptions } from "./exports";

export type KinkAttributeKind = "dominant" | "submissive" | null;

export interface AttributeMetadata {
	gender:
		| {
				order?: number;
				simple?: boolean;
				fallback?: boolean;
				plural?: string;
				conflicts?: Array<string>;
		  }
		| undefined;
	sexuality: undefined;
	language: undefined;
	game: undefined;
	interest: undefined;
	platform: undefined;
	country: {
		flagUrl: string;
	};
	kink: {
		kind: KinkAttributeKind;
		pair: string;
	};
	"report-reason": {
		order: number;
		fallback?: boolean;
	};
	"delete-reason": {
		order: number;
		fallback?: boolean;
	};
}

export type AttributeType = keyof AttributeMetadata;

export type Attribute<T = unknown> = UuidModel & {
	type: keyof AttributeMetadata;
	name: string;
	metadata: T;
};

export type PartialAttribute = Pick<Attribute<unknown>, "id" | "type">;

export type AttributeCollection<T extends string> = Array<
	Attribute<T extends AttributeType ? AttributeMetadata[T] : unknown>
>;

export type PartialAttributeCollection = Array<PartialAttribute>;

export async function list<T extends string>(
	name: T,
	options: NarrowFetchOptions = {}
): Promise<AttributeCollection<T>> {
	return fetch<AttributeCollection<T>>("get", `attributes/${name}`, options);
}

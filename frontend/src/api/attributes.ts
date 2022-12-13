import { UpdatedAtModel, UuidModel } from "./common";

import { fetch, FetchOptions } from ".";

export type Attribute<T = unknown> = UuidModel &
	UpdatedAtModel & {
		type: string;
		name: string;
		metadata?: T;
	};

export type AttributeCollection<T = unknown> = Array<Attribute<T>>;

export interface GenderAttributeMetadata {
	order?: number;
	simple?: boolean;
	fallback?: boolean;
	conflicts?: Array<string>;
}

export async function list<T = unknown>(
	name: string,
	options: FetchOptions = {}
): Promise<AttributeCollection<T>> {
	return fetch<AttributeCollection<T>>("get", `attributes/${name}`, options);
}

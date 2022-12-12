import { UpdatedAtModel, UuidModel } from "./common";

import { fetch, FetchOptions } from ".";

export type Attribute = UuidModel &
	UpdatedAtModel & {
		type: string;
		name: string;
	};

export type AttributeCollection = Array<Attribute>;

export async function list(name: string, options: FetchOptions = {}): Promise<AttributeCollection> {
	return fetch<AttributeCollection>("get", `attributes/${name}`, options);
}

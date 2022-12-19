import { UuidModel } from "./common";

import { fetch, FetchOptions } from ".";

export type Attribute<T = unknown> = UuidModel & {
	type: string;
	name: string;
	metadata: T;
};

export type AttributeCollection<T = unknown> = Array<Attribute<T>>;

export async function list<T = unknown>(
	name: string,
	options: FetchOptions = {}
): Promise<AttributeCollection<T>> {
	return fetch<AttributeCollection<T>>("get", `attributes/${name}`, options);
}

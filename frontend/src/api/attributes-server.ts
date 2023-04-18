import "server-only";

// eslint-disable-next-line import/named
import { cache } from "react";

import { thruServerCookies } from "~/server-utilities";

import { AttributeType, get, list, AttributeCollection } from "./attributes";

const _withAttributeList = cache((type: AttributeType) => {
	return list(type, thruServerCookies());
});

export async function withAttributeList<T extends AttributeType>(
	type: T
): Promise<AttributeCollection<T>> {
	return _withAttributeList(type) as Promise<AttributeCollection<T>>;
}

export const withAttribute = cache((type: AttributeType, id: string) => {
	return get(type, id, thruServerCookies());
});

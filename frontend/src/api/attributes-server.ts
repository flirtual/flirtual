import "server-only";

// eslint-disable-next-line import/named
import { cache } from "react";

import { thruServerCookies } from "~/server-utilities";

import {
	AttributeType,
	get,
	list,
	AttributeCollection,
	Attribute,
	AttributeMetadata
} from "./attributes";

const _withAttributeList = cache((type: AttributeType) => {
	return list(type, { ...thruServerCookies(), cache: "force-cache" });
});

export async function withAttributeList<T extends AttributeType>(
	type: T
): Promise<AttributeCollection<T>> {
	return _withAttributeList(type) as Promise<AttributeCollection<T>>;
}

const _withAttribute = cache((type: AttributeType, id: string) => {
	return get(type, id, { ...thruServerCookies(), cache: "force-cache" });
});

export function withAttribute<T extends AttributeType>(
	type: T,
	id: string
): Promise<Attribute<AttributeMetadata[T]>> {
	return _withAttribute(type, id) as unknown as Promise<Attribute<AttributeMetadata[T]>>;
}

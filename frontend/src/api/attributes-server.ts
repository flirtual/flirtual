import "server-only";

// eslint-disable-next-line import/named
import { cache } from "react";

import { thruServerCookies } from "~/server-utilities";

import { AttributeType, get, list } from "./attributes";

export const withAttributeList = cache((type: AttributeType) => {
	return list(type, thruServerCookies());
});

export const withAttribute = cache((type: AttributeType, id: string) => {
	return get(type, id, thruServerCookies());
});

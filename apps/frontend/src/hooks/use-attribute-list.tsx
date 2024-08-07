import { useDebugValue } from "react";
import useSWR, { type SWRConfiguration } from "swr";

import { api } from "~/api";

import type { AttributeCollection, AttributeMetadata } from "~/api/attributes";

export function useAttributeList<T extends keyof AttributeMetadata>(
	name: T,
	options: Omit<
		SWRConfiguration<AttributeCollection<T>>,
		"fetcher" | "fallbackData"
	> = {}
) {
	useDebugValue(name);

	const { data: attributes = [] } = useSWR(
		["attribute", name],
		([, name]) => api.attributes.list<T>(name),
		{
			fallbackData: [],
			revalidateOnFocus: false,
			keepPreviousData: true,
			...options
		}
	);

	return attributes;
}

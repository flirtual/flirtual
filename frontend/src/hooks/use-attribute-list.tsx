import { useDebugValue } from "react";
import useSWR, { SWRConfiguration } from "swr";

import { api } from "~/api";
import { AttributeCollection, AttributeMetadata } from "~/api/attributes";

export function useAttributeList<T extends keyof AttributeMetadata>(
	name: T,
	options: Omit<SWRConfiguration<AttributeCollection<T>>, "fetcher" | "fallbackData"> = {}
) {
	useDebugValue(name);

	const { data: attributes = [] } = useSWR(
		["attribute", name],
		([, name]) => api.attributes.list<T>(name),
		{
			fallbackData: [],
			revalidateOnFocus: false,
			...options
		}
	);

	return attributes;
}

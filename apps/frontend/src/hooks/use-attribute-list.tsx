import { useDebugValue } from "react";
import useSWR from "swr";

import { Attribute, type AttributeMetadata } from "~/api/attributes";

export function useAttributeList<T extends keyof AttributeMetadata>(type: T) {
	useDebugValue(type);

	const { data: attributes = [] } = useSWR(
		["attribute", type],
		([, type]) => Attribute.list<T>(type),
		{
			revalidateOnFocus: false,
			revalidateIfStale: false,
			keepPreviousData: true,
			suspense: true
		}
	);

	return attributes;
}

export function useAttribute<T extends keyof AttributeMetadata>(
	type: T,
	id: string
) {
	useDebugValue(`${type} - ${id}`);

	const { data: attribute } = useSWR(
		["attribute", type, id],
		([, type, id]) => Attribute.get<T>(type, id),
		{
			revalidateOnFocus: false,
			revalidateIfStale: false,
			keepPreviousData: true,
			suspense: true
		}
	);

	return attribute;
}

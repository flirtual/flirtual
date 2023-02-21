import useSWR, { SWRConfiguration } from "swr";

import { api } from "~/api";
import { AttributeCollection } from "~/api/attributes";

export function useAttributeList<T = unknown>(
	name: string,
	options: Omit<SWRConfiguration<AttributeCollection<T>>, "fetcher" | "fallbackData"> = {}
) {
	return useSWR(
		["attribute", name],
		([, name]) => api.attributes.list(name) as Promise<AttributeCollection<T>>,
		{
			fallbackData: [],
			revalidateOnFocus: false,
			...options
		}
	);
}

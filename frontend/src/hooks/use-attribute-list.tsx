import useSWR, { SWRConfiguration } from "swr";

import { api } from "~/api";
import { AttributeCollection } from "~/api/attributes";

export function useAttributeList(
	name: string,
	options: Omit<SWRConfiguration<AttributeCollection>, "fetcher"> = {}
) {
	return useSWR(["attribute", name], ([, name]) => api.attributes.list(name), {
		fallbackData: [],
		...options
	});
}

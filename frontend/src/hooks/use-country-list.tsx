import { AttributeCollection } from "~/api/attributes";

import { useAttributeList } from "./use-attribute-list";

export interface CountryAttributeMetadata {
	flagUrl: string;
}

export type CountryAttributeCollection = AttributeCollection<CountryAttributeMetadata>;

export function useCountryList(): CountryAttributeCollection {
	const { data = [] } = useAttributeList<CountryAttributeMetadata>("country");
	return data;
}

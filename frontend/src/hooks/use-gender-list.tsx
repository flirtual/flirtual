import { AttributeCollection } from "~/api/attributes";

import { useAttributeList } from "./use-attribute-list";

export interface GenderAttributeMetadata {
	order?: number;
	simple?: boolean;
	fallback?: boolean;
	plural?: string;
	conflicts?: Array<string>;
}

export type GenderAttributeCollection = AttributeCollection<GenderAttributeMetadata | undefined>;

export function useGenderList(): GenderAttributeCollection {
	const { data = [] } = useAttributeList<GenderAttributeMetadata | undefined>("gender");
	return data;
}

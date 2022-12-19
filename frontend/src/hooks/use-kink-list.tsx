import { AttributeCollection } from "~/api/attributes";

import { useAttributeList } from "./use-attribute-list";

export type KinkAttributeKind = "dominant" | "submissive" | null;

export interface KinkAttributeMetadata {
	kind: KinkAttributeKind;
	pair: string;
}

export type KinkAttributeCollection = AttributeCollection<KinkAttributeMetadata>;

export function useKinkList(): KinkAttributeCollection {
	const { data = [] } = useAttributeList<KinkAttributeMetadata>("kink");
	return data;
}

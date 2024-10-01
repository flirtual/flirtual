import { useMessages } from "next-intl";
import { useDebugValue } from "react";
import useSWR from "swr";

import { Attribute, type AttributeType } from "~/api/attributes";

export function useAttributeList<T extends AttributeType>(type: T) {
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

export function useAttribute<T extends AttributeType>(type: T, id: string) {
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

export interface AttributeTranslationMetadata {
	gender: {
		plural?: string;
		definition?: string;
	};
	sexuality: {
		definition: string;
	};
	"ban-reason": {
		details: string;
	};
}

export type AttributeTranslation<T extends AttributeType> = {
	name: string;
} & (T extends keyof AttributeTranslationMetadata
	? AttributeTranslationMetadata[T]
	: Record<string, never>);

export function useAttributeTranslation<
	T extends AttributeType = AttributeType
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(type?: T): Record<string, AttributeTranslation<T>> {
	const { attributes: tAttributes } = useMessages() as {
		attributes: Record<string, AttributeTranslation<T>>;
	};

	return tAttributes;
}

"use client";

import ms from "ms";
import { useMessages } from "next-intl";
import { useDebugValue } from "react";

import type { AttributeCollection, AttributeType } from "~/api/attributes";
import { attributeFetcher, attributeKey, useQuery } from "~/query";

export function useAttributes<T extends AttributeType>(type: T): AttributeCollection<T> {
	useDebugValue(type);

	return useQuery({
		queryKey: attributeKey(type),
		queryFn: attributeFetcher<T>,
		meta: {
			cacheTime: ms("30d")
		}
	});
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
// eslint-disable-next-line unused-imports/no-unused-vars
>(type?: T): Record<string, AttributeTranslation<T>> {
	const { attributes: tAttributes } = useMessages();

	return tAttributes as Record<string, AttributeTranslation<T>>;
}

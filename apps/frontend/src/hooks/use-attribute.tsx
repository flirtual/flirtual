"use client";

import { useMessages } from "next-intl";
import { useDebugValue } from "react";

import type { AttributeType } from "~/api/attributes";
import { attributeFetcher, attributeKey, useSWR } from "~/swr";

export function useAttributes<T extends AttributeType>(type: T) {
	useDebugValue(type);

	const { data: attributes = [] } = useSWR(attributeKey(type), attributeFetcher);
	return attributes;
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

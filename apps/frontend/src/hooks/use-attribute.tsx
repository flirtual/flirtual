"use client";

import { useMessages } from "next-intl";
import { useDebugValue } from "react";
import useSWR from "swr";

import { Attribute, type AttributeType } from "~/api/attributes";
import { attributeKey } from "~/swr";

export function useAttributes<T extends AttributeType>(type: T) {
	useDebugValue(type);

	const { data: attributes = [] } = useSWR(
		attributeKey(type),
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
	const { attributes: tAttributes } = useMessages() as {
		attributes: Record<string, AttributeTranslation<T>>;
	};

	return tAttributes;
}

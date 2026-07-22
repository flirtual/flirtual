import ms from "ms" with { type: "macro" };
import { useDebugValue, useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { AttributeCollection, AttributeType } from "~/api/attributes";
import { attributeFetcher, attributeKey, useQuery } from "~/query";

import { useConfig } from "./use-config";

export function useAttributes<T extends AttributeType>(type: T): AttributeCollection<T> {
	useDebugValue(type);

	// Refetches whenever the digest changes.
	const { attributes } = useConfig();

	return useQuery({
		queryKey: attributeKey(type, attributes[type]),
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
		definitionLink?: string;
	};
	sexuality: {
		definition?: string;
		definitionLink?: string;
	};
	kink: {
		definitionLink?: string;
	};
	"ban-reason": {
		details: string;
	};
	"warn-reason": {
		details: string;
	};
}

export type AttributeTranslation<T extends AttributeType> = {
	name: string;
	example?: string;
} & (T extends keyof AttributeTranslationMetadata
	? AttributeTranslationMetadata[T]
	: Record<string, never>);

export function useAttributeTranslation<
	T extends AttributeType = AttributeType
// eslint-disable-next-line unused-imports/no-unused-vars
>(type?: T): Record<string, AttributeTranslation<T>> {
	const { t } = useTranslation();
	const translations = t("attributes", { returnObjects: true }) as Record<string, AttributeTranslation<T>>;

	// An attribute may exist before its translation, so an unknown id falls back
	// to itself instead of throwing.
	return useMemo(() => new Proxy(translations, {
		get: (target, key) => (typeof key === "string" && !(key in target))
			? { name: key }
			: Reflect.get(target, key)
	}), [translations]);
}

"use client";

import { useDebugValue } from "react";

import { setPreferences } from "~/preferences";
import {
	preferencesFetcher,
	preferencesKey,
	useMutation,
	useQuery
} from "~/query";

import { usePostpone } from "./use-postpone";

/**
 * A hook for getting and setting preferences.
 *
 * @see [Capacitor.js Preferences Plugin](https://capacitorjs.com/docs/apis/preferences)
 */
export function usePreferences<T>(key: string, defaultValue?: T) {
	useDebugValue(key);

	// eslint-disable-next-line react-hooks/rules-of-hooks
	if (defaultValue === undefined) usePostpone("usePreferences() without defaultValue");

	const queryKey = preferencesKey(key);

	const data = useQuery({
		queryKey,
		queryFn: preferencesFetcher<T>,
		placeholderData: defaultValue,
		meta: {
			cacheTime: 0,
		}
	});

	const { mutateAsync } = useMutation({
		mutationKey: queryKey,
		mutationFn: async (newValue: T | null) => {
			await setPreferences(key, newValue);
			return newValue;
		},
	});

	return [(data ?? defaultValue), mutateAsync] as const;
}

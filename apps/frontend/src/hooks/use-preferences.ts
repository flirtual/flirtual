"use client";

import { Preferences } from "@capacitor/preferences";
import { useCallback, useDebugValue } from "react";

import { useSWR } from "~/swr";

import { usePostpone } from "./use-postpone";

export async function getPreference<T>(key: string) {
	const { value: localValue } = await Preferences.get({ key });

	return localValue
		? (JSON.parse(localValue) as T)
		: null;
}

/**
 * A hook for getting and setting preferences.
 *
 * @see [Capacitor.js Preferences Plugin](https://capacitorjs.com/docs/apis/preferences)
 */
export function usePreferences<T>(key: string, defaultValue?: T) {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	if (defaultValue === undefined) usePostpone("usePreferences() without defaultValue");

	const { data = null, mutate } = useSWR(
		["preferences", key] as const,
		([, key]) => getPreference<T>(key),
		{
			fallbackData: defaultValue
		}
	);

	useDebugValue(key);

	const set = useCallback(
		async (newValue: T | null) => {
			if (newValue == null) {
				await Preferences.remove({ key });
				await mutate(null);
			}
			else {
				await Preferences.set({ key, value: JSON.stringify(newValue) });
				await mutate(newValue);
			}
		},
		[key, mutate]
	);

	return [(data ?? defaultValue), set] as const;
}

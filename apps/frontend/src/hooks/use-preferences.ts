"use client";

import { useCallback, useDebugValue } from "react";
import { Preferences } from "@capacitor/preferences";
import useSWR from "swr";

export async function getPreference<T>(key: string) {
	return Preferences.get({ key }).then(({ value: localValue }) =>
		localValue ? (JSON.parse(localValue) as T) : null
	);
}

/**
 * A hook for getting and setting preferences.
 *
 * This function doesn't keep the value in sync with the preferences,
 * as changes are only known when the hook is re-rendered or updated using the `set` function.
 *
 * @see [Capacitor.js Preferences Plugin](https://capacitorjs.com/docs/apis/preferences)
 */
export function usePreferences<T>(key: string, defaultValue: T) {
	const { data, mutate } = useSWR(
		["preferences", key] as const,
		([, key]) => getPreference<T>(key),
		{ suspense: true }
	);

	useDebugValue(key);

	const set = useCallback(
		async (newValue: T) => {
			await Preferences.set({ key, value: JSON.stringify(newValue) });
			await mutate(newValue);
		},
		[key]
	);

	const value = data === null ? defaultValue : data;
	return [value, set] as const;
}

"use client";

import { Preferences } from "@capacitor/preferences";
import { useCallback, useDebugValue } from "react";
import useSWR from "swr";

export function getPreference<T>(key: string) {
	return Preferences.get({ key }).then(({ value: localValue }) =>
		localValue ? (JSON.parse(localValue) as T) : null
	);
}

/**
 * A hook for getting and setting preferences.
 *
 * @see [Capacitor.js Preferences Plugin](https://capacitorjs.com/docs/apis/preferences)
 */
export function usePreferences<T>(key: string, defaultValue: T) {
	const { isLoading, data = null, mutate } = useSWR(
		["preferences", key] as const,
		([, key]) => getPreference<T>(key),
		{}
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

	return [isLoading ? null : (data ?? defaultValue), set] as const;
}

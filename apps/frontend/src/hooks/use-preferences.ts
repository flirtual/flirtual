"use client";

import { use, useCallback, useDebugValue, useState, useMemo } from "react";
import { Preferences } from "@capacitor/preferences";

export async function getPreference<T>(key: string, defaultValue: T) {
	return (
		typeof window === "undefined"
			? Promise.resolve({ value: null })
			: Preferences.get({ key })
	).then(({ value: localValue }) =>
		localValue ? (JSON.parse(localValue) as T) : defaultValue
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
	const [lastUpdated, setLastUpdated] = useState(Date.now());

	const value = use(
		useMemo(
			() => getPreference(key, defaultValue),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[key, defaultValue, lastUpdated]
		)
	);

	useDebugValue(key);

	const set = useCallback(
		(newValue: T) => {
			void Preferences.set({ key, value: JSON.stringify(newValue) }).then(() =>
				setLastUpdated(Date.now())
			);
		},
		[key]
	);

	return [value, set] as const;
}

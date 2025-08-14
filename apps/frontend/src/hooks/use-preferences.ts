import { useDebugValue } from "react";

import { setPreferences } from "~/preferences";
import {
	preferencesFetcher,
	preferencesKey,
	useMutation,
	useQuery
} from "~/query";

// import { postpone } from "./use-postpone";

/**
 * A hook for getting and setting preferences.
 *
 * @see [Capacitor.js Preferences Plugin](https://capacitorjs.com/docs/apis/preferences)
 */
export function usePreferences<T>(key: string): [T | null, (value: T | null) => Promise<T | null>];
export function usePreferences<T>(key: string, defaultValue: T): [T, (value: T | null) => Promise<T | null>];
export function usePreferences<T>(key: string, defaultValue?: T): [T | null, (value: T | null) => Promise<T | null>] {
	useDebugValue(key);

	// if (defaultValue === undefined) postpone("usePreferences() without defaultValue");

	const queryKey = preferencesKey(key);

	const value = useQuery({
		queryKey,
		queryFn: preferencesFetcher<T>,
		placeholderData: defaultValue,
		networkMode: "always",
		meta: {
			cacheTime: 0,
		}
	});

	const { mutateAsync } = useMutation({
		mutationKey: queryKey,
		mutationFn: async (newValue: T | null) => {
			if (newValue === value) return newValue;

			await setPreferences(key, newValue);
			return newValue;
		},
	});

	return [(value ?? defaultValue ?? null), mutateAsync] as const;
}

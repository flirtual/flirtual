"use client";

import { Preferences } from "@capacitor/preferences";
import { useDebugValue } from "react";

import {
	preferencesFetcher,
	preferencesKey,
	useMutation,
	useQuery,
} from "~/query";

import { usePostpone } from "./use-postpone";

await Preferences.configure({ group: "" });

export async function getPreference<T>(key: string) {
	const { value: localValue } = await Preferences.get({ key });

	return localValue
		? (JSON.parse(localValue) as T)
		: null;
}

export async function setPreference<T>(key: string, value: T | null): Promise<void> {
	if (value == null) {
		await Preferences.remove({ key });
		return;
	}

	await Preferences.set({
		key,
		value: JSON.stringify(value)
	});
}

export async function listPreferences(): Promise<Array<string>> {
	const { keys } = await Preferences.keys();
	return keys;
}

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
	});

	const { mutateAsync } = useMutation({
		mutationKey: queryKey,
		mutationFn: async (newValue: T | null) => {
			await setPreference(key, newValue);
			return newValue;
		},
	});

	return [(data ?? defaultValue), mutateAsync] as const;
}

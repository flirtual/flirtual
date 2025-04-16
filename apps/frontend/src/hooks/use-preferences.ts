"use client";

import { Preferences } from "@capacitor/preferences";
import { useCallback, useDebugValue } from "react";

import {
	mutate,
	preferencesFetcher,
	preferencesKey,
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

interface SetPreferenceOptions {
	mutate?: boolean;
}

export async function setPreference<T>(key: string, value: T | null, { mutate: doMutate = true }: SetPreferenceOptions = {}): Promise<void> {
	if (value == null) {
		await Preferences.remove({ key });
		if (doMutate) mutate(preferencesKey(key), null);

		return;
	}

	await Preferences.set({ key, value: JSON.stringify(value) });
	if (doMutate) mutate(preferencesKey(key), value);
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

	const data = useQuery({
		queryKey: preferencesKey(key),
		queryFn: preferencesFetcher<T>,
		placeholderData: defaultValue,
	});

	const set = useCallback(async (newValue: T | null) => setPreference(key, newValue), [key]);

	return [(data ?? defaultValue), set] as const;
}

import { Preferences } from "@capacitor/preferences";

import { log as _log } from "~/log";

const log = _log.extend("preferences");

await Preferences.configure({ group: "" });

export async function getPreferences<T>(key: string) {
	const { value: localValue } = await Preferences.get({ key });

	return localValue
		? (JSON.parse(localValue) as T)
		: null;
}

export async function setPreferences<T>(key: string, value: T | null): Promise<void> {
	if (value == null) {
		await Preferences.remove({ key });

		log("%s removed", key);
		return;
	}

	await Preferences.set({ key, value: JSON.stringify(value) });
	log("%s set: %o", key, value);
}

export async function listPreferences(): Promise<Array<string>> {
	const { keys } = await Preferences.keys();
	return keys;
}

export async function clearPreferences(): Promise<void> {
	const { keys } = await Preferences.keys();

	await Preferences.clear();
	log("cleared %d preferences", keys.length);
}

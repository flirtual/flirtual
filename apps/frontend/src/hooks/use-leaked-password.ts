import { setPreferences } from "~/preferences";
import { mutate, preferencesKey } from "~/query";

import { usePreferences } from "./use-preferences";

// Checking a password against known breaches needs the password itself, so it only happens
// on login; the result is remembered on this device, against the user it applies to.
const key = "leaked_password";

export async function rememberLeakedPassword(userId: string, leaked?: boolean) {
	const value = leaked ? userId : null;

	await setPreferences(key, value);
	await mutate(preferencesKey(key), value);
}

export function useLeakedPassword(userId: string) {
	const [leakedFor, setLeakedFor] = usePreferences<string | null>(key, null);

	return [leakedFor === userId, () => setLeakedFor(null)] as const;
}

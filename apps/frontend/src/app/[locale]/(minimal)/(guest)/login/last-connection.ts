import type { ConnectionType } from "~/api/connections";
import { usePreferences } from "~/hooks/use-preferences";
import { getPreferences, setPreferences } from "~/preferences";
import { mutate, preferencesKey } from "~/query";

const lastKey = "login_connection";
const attemptKey = "login_connection_attempt";

// Pins the last successful login connection to the top of the list.
export function useLoginConnectionTypes<T extends ConnectionType>(types: ReadonlyArray<T>): ReadonlyArray<T> {
	const [last] = usePreferences<ConnectionType | null>(lastKey, null);

	const [remembered] = types.filter((type) => type === last);
	if (!remembered) return types;

	return [remembered, ...types.filter((type) => type !== last)];
}

export function useRememberLoginConnection() {
	const [, setLast] = usePreferences<ConnectionType | null>(lastKey, null);
	const [, setAttempt] = usePreferences<ConnectionType | null>(attemptKey, null);

	return {
		// The browser leaves for the provider before we learn whether the grant succeeded,
		// so the attempt is stored for the next load of this page to resolve.
		attempted: (type: ConnectionType) => setAttempt(type),
		succeeded: async (type: ConnectionType) => {
			await setLast(type);
			await setAttempt(null);
		}
	};
}

// Resolve the connection the browser left for, before rendering: a rejected grant returns
// here with an `error` parameter, a successful one lands on the queue or onboarding and
// never comes back, so an attempt that survived the round trip signed the client in.
export async function resolveLoginConnection(request: Request) {
	const [last, attempt] = await Promise.all([
		getPreferences<ConnectionType>(lastKey),
		getPreferences<ConnectionType>(attemptKey)
	]);

	let resolved = last;

	if (attempt) {
		await setPreferences(attemptKey, null);
		await mutate(preferencesKey(attemptKey), null);

		if (!new URL(request.url).searchParams.has("error")) {
			resolved = attempt;
			await setPreferences(lastKey, attempt);
		}
	}

	await mutate(preferencesKey(lastKey), resolved);
}

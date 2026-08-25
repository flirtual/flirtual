import { useCallback } from "react";

import type { Session } from "~/api/auth";
import { Preferences } from "~/api/user/preferences";
import { mutate, sessionKey } from "~/query";

import { useSession } from "./use-session";

export function useDismissed(key: string): [boolean, () => Promise<void>] {
	const { user } = useSession();
	const dismissed = user.preferences?.dismissed ?? [];
	const isDismissed = dismissed.includes(key);

	const dismiss = useCallback(async () => {
		if (isDismissed) return;

		const preferences = await Preferences.update(user.id, {
			dismissed: [...dismissed, key]
		});

		await mutate<Session>(
			sessionKey(),
			(session) => session && { ...session, user: { ...session.user, preferences } }
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isDismissed, user.id, key, dismissed.join(",")]);

	return [isDismissed, dismiss];
}

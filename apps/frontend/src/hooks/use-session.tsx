import { PushNotifications } from "@capacitor/push-notifications";
import { useLocale } from "next-intl";
import { useCallback } from "react";

import { Authentication, type Session } from "~/api/auth";
import type { User } from "~/api/user";
import { redirect } from "~/i18n/navigation";
import { type SWRConfiguration, useSWR } from "~/swr";
import { sessionKey } from "~/swr";
import { urls } from "~/urls";

import { useDevice } from "./use-device";

export function useOptionalSession(options: SWRConfiguration<Session | null> = {}) {
	const { native } = useDevice();

	const { data: session = null, mutate } = useSWR(
		sessionKey(),
		Authentication.getOptionalSession,
		{
			suspense: true,
			...options
		}
	);

	const logout = useCallback(async () => {
		if (native) await PushNotifications.unregister();

		await Authentication.logout().catch(() => null);
	}, [native]);

	return [session, mutate, logout] as const;
}

export function useCurrentUser(): User | null {
	const [session] = useOptionalSession();
	return session?.user ?? null;
}

export function useSession() {
	const [session, mutate, logout] = useOptionalSession();
	const locale = useLocale();

	if (!session) return redirect({ href: urls.login(), locale });

	return [session, mutate, logout] as const;
}

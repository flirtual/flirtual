import { PushNotifications } from "@capacitor/push-notifications";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useSWR, { type SWRConfiguration } from "swr";

import { Authentication, type Session } from "~/api/auth";
import type { User } from "~/api/user";
import { sessionKey } from "~/swr";
import { urls } from "~/urls";

import { useDevice } from "./use-device";

export function useSession(options: SWRConfiguration<Session | null> = {}) {
	const router = useRouter();
	const { native } = useDevice();

	const { data: session = null, mutate } = useSWR(
		sessionKey(),
		Authentication.getOptionalSession,
		{
			suspense: true,
			fallbackData: null,
			...options
		}
	);

	const update = useCallback(
		async (session?: Session | null, refresh: boolean = true) => {
			await mutate(session || undefined, { revalidate: false });
			if (refresh) router.refresh();
		},
		[mutate, router]
	);

	const logout = useCallback(async () => {
		if (native) await PushNotifications.unregister();
		await Authentication.logout().catch(() => null);
		router.push(urls.login());
		router.refresh();
	}, [native, router]);

	return [session, update, logout] as const;
}

export function useCurrentUser(): User | null {
	const [session] = useSession();
	return session?.user ?? null;
}

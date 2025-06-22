import { PushNotifications } from "@capacitor/push-notifications";
import { useLocale } from "next-intl";

import type { Session } from "~/api/auth";
import { Authentication } from "~/api/auth";
import { redirect, useSearchParams } from "~/i18n/navigation";
import type {
	MinimalQueryOptions
} from "~/query";
import {
	invalidate,
	mutate,
	sessionFetcher,
	sessionKey,
	useQuery
} from "~/query";
import { toAbsoluteUrl, toRelativeUrl, urls } from "~/urls";

import { device } from "./use-device";

export async function logout() {
	await mutate(sessionKey(), null);

	const { native } = device;
	if (native) await PushNotifications.unregister();

	await Authentication.logout().catch(() => null);
	await invalidate();
}

export function useOptionalSession(queryOptions: MinimalQueryOptions<Session | null> = {}): Session | null {
	return useQuery({
		placeholderData: null,
		...queryOptions,
		queryKey: sessionKey(),
		queryFn: sessionFetcher,
	});
}

export function useGuest() {
	const locale = useLocale();
	const session = useOptionalSession();

	const next = toRelativeUrl(
		toAbsoluteUrl(useSearchParams().get("next")
			|| (session?.user.status === "registered"
				? urls.onboarding(1)
				: urls.discover("love")))
	);

	if (session) redirect({ href: next, locale });
}

export function useSession(queryOptions: MinimalQueryOptions<Session | null> = {}) {
	const locale = useLocale();
	const session = useQuery({
		...queryOptions,
		queryKey: sessionKey(),
		queryFn: sessionFetcher
	});

	if (!session) return redirect({ href: urls.login(toRelativeUrl(location)), locale });

	return session;
}

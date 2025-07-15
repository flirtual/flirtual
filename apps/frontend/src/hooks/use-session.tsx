import { PushNotifications } from "@capacitor/push-notifications";
import { useNavigate, useSearchParams } from "react-router";

import type { Session } from "~/api/auth";
import { Authentication } from "~/api/auth";
// import { redirect, useSearchParams } from "~/i18n/navigation";
import type {
	MinimalQueryOptions
} from "~/query";
import {
	evictQueries,
	invalidate,
	mutate,
	sessionFetcher,
	sessionKey,
	useQuery
} from "~/query";
import { toAbsoluteUrl, toRelativeUrl, urls } from "~/urls";

import { device } from "./use-device";
// import { postpone } from "./use-postpone";

export async function logout() {
	await mutate(sessionKey(), null);

	const { native } = device;
	if (native) await PushNotifications.unregister();

	await Authentication.logout().catch(() => null);
	await invalidate();

	await evictQueries();
}

export function useOptionalSession(queryOptions: MinimalQueryOptions<Session | null> = {}): Session | null {
	// postpone(useOptionalSession.name);

	return useQuery({
		placeholderData: null,
		...queryOptions,
		queryKey: sessionKey(),
		queryFn: sessionFetcher,
	});
}

export function useGuest() {
	const session = useOptionalSession();

	const [searchParameters] = useSearchParams();
	const navigate = useNavigate();

	const next = toRelativeUrl(
		toAbsoluteUrl(searchParameters.get("next")
			|| (session?.user.status === "registered"
				? urls.onboarding(1)
				: urls.discover("dates")))
	);

	if (session) navigate(next);
}

export function useSession(queryOptions: MinimalQueryOptions<Session | null> = {}) {
	const navigate = useNavigate();

	const session = useQuery({
		...queryOptions,
		queryKey: sessionKey(),
		queryFn: sessionFetcher
	});

	if (!session) navigate(urls.login(toRelativeUrl(location)));
	return session;
}

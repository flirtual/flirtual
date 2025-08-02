import { PushNotifications } from "@capacitor/push-notifications";
import { useSearchParams } from "react-router";

import type { Session } from "~/api/auth";
import { Authentication } from "~/api/auth";
import type {
	MinimalQueryOptions
} from "~/query";
import {
	evictQueries,
	invalidate,
	mutate,
	queryClient,
	sessionFetcher,
	sessionKey,
	useQuery
} from "~/query";
import { throwRedirect } from "~/redirect";
import { toAbsoluteUrl, toRelativeUrl, urls } from "~/urls";

import { device } from "./use-device";

export async function logout() {
	await mutate(sessionKey(), null);

	const { native } = device;
	if (native) await PushNotifications.unregister();

	await Authentication.logout().catch(() => null);
	await invalidate();

	await evictQueries();
}

export const getSession = () => queryClient.getQueryData<Session>(sessionKey()) || null;

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

	const next = toRelativeUrl(
		toAbsoluteUrl(searchParameters.get("next")
			|| (session?.user.status === "registered"
				? urls.onboarding(1)
				: urls.discover("dates")))
	);

	if (session) throwRedirect(next);
}

export function useSession(queryOptions: MinimalQueryOptions<Session | null> = {}) {
	const session = useQuery({
		...queryOptions,
		queryKey: sessionKey(),
		queryFn: sessionFetcher
	});

	if (!session) throwRedirect(urls.login(toRelativeUrl(location)));
	return session;
}

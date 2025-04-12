import { PushNotifications } from "@capacitor/push-notifications";
import { useLocale } from "next-intl";

import { Authentication, type Session } from "~/api/auth";
import { redirect } from "~/i18n/navigation";
import { sessionFetcher, type SWRConfiguration, useSWR } from "~/swr";
import { sessionKey } from "~/swr";
import { urls } from "~/urls";

import { devicePromise } from "./use-device";
import { usePostpone } from "./use-postpone";

export async function logout() {
	const { native } = await devicePromise;
	if (native) await PushNotifications.unregister();

	await Authentication.logout().catch(() => null);
}

export function useOptionalSession(options: SWRConfiguration<Session | null> = {}) {
	const { data: session = null } = useSWR(sessionKey(), sessionFetcher, {
		suspense: true,
		fallbackData: null,
		...options
	});

	return session;
}

export function useSession(options: SWRConfiguration<Session | null> = {}) {
	usePostpone("useSession()");

	const { data: session } = useSWR(sessionKey(), sessionFetcher, {
		suspense: true,
		...options
	});

	const locale = useLocale();
	if (!session) return redirect({ href: urls.login(), locale });

	return session;
}

import { PushNotifications } from "@capacitor/push-notifications";
import { useLocale } from "next-intl";

import { Authentication, type Session } from "~/api/auth";
import { redirect } from "~/i18n/navigation";
import { sessionFetcher, type SWRConfiguration, useLazySWR, useSWR } from "~/swr";
import { sessionKey } from "~/swr";
import { urls } from "~/urls";

import { device } from "./use-device";
import { usePostpone } from "./use-postpone";

export async function logout() {
	const { native } = device;
	if (native) await PushNotifications.unregister();

	await Authentication.logout().catch(() => null);
}

export function useOptionalSession(options: SWRConfiguration<Session | null> = {}) {
	const { data: session = null } = useLazySWR(sessionKey(), sessionFetcher, {
		fallbackData: null,
		...options
	});

	return session;
}

export function useSession(options: SWRConfiguration<Session | null> = {}) {
	usePostpone("useSession()");

	const { data: session } = useSWR(sessionKey(), sessionFetcher, options);

	const locale = useLocale();
	if (!session) return redirect({ href: urls.login(), locale });

	return session;
}

import { PushNotifications } from "@capacitor/push-notifications";
import { useLocale } from "next-intl";

import { Authentication } from "~/api/auth";
import { redirect } from "~/i18n/navigation";
import {
	invalidate,
	mutate,
	sessionFetcher,
	sessionKey,
	useQuery
} from "~/query";
import { toRelativeUrl, urls } from "~/urls";

import { device } from "./use-device";
import { usePostpone } from "./use-postpone";

export async function logout() {
	await mutate(sessionKey(), null);

	const { native } = device;
	if (native) await PushNotifications.unregister();

	await Authentication.logout().catch(() => null);
	await invalidate();
}

export function useOptionalSession() {
	return useQuery({
		queryKey: sessionKey(),
		queryFn: sessionFetcher,
		placeholderData: null,
	});
}

export function useSession() {
	usePostpone("useSession()");

	const data = useQuery({
		queryKey: sessionKey(),
		queryFn: sessionFetcher
	});

	const locale = useLocale();
	if (!data) return redirect({ href: urls.login(toRelativeUrl(location)), locale });

	return data;
}

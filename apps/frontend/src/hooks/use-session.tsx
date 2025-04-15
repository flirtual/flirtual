import { PushNotifications } from "@capacitor/push-notifications";
import { useLocale } from "next-intl";

import { Authentication } from "~/api/auth";
import { redirect } from "~/i18n/navigation";
import { sessionFetcher, sessionKey, useQuery } from "~/swr";
import { urls } from "~/urls";

import { device } from "./use-device";
import { usePostpone } from "./use-postpone";

export async function logout() {
	const { native } = device;
	if (native) await PushNotifications.unregister();

	await Authentication.logout().catch(() => null);
}

export function useOptionalSession() {
	const { data } = useQuery({
		queryKey: sessionKey(),
		queryFn: sessionFetcher,
		placeholderData: null,
	});

	return data;
}

export function useSession() {
	usePostpone("useSession()");

	const { data } = useQuery({
		queryKey: sessionKey(),
		queryFn: sessionFetcher
	});

	const locale = useLocale();
	if (!data) return redirect({ href: urls.login(), locale });

	return data;
}

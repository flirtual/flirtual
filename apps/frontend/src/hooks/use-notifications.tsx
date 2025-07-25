import {

	PushNotifications
} from "@capacitor/push-notifications";
import type { PermissionStatus } from "@capacitor/push-notifications";
import {
	createContext,

	use,
	useMemo
} from "react";
import type { PropsWithChildren } from "react";

import { User } from "~/api/user";
import { useQuery } from "~/query";

import { useDevice } from "./use-device";
import { useOptionalSession } from "./use-session";

export interface NotificationContext {
	status: PermissionStatus["receive"];
}

const NotificationContext = createContext({} as NotificationContext);

export function NotificationProvider({ children }: PropsWithChildren) {
	const { platform, native } = useDevice();
	const session = useOptionalSession();

	useQuery({
		queryKey: ["notifications-reset-count"],
		queryFn: async () => {
			if (
				!session?.user.id
				|| document.visibilityState === "hidden"
				|| !session.user.pushCount
			)
				return null;

			await	User.resetPushCount(session.user.id);
			return null;
		},
		placeholderData: null,
		meta: {
			cacheTime: 0
		}
	});

	const status = useQuery({
		queryKey: ["notifications-permissions"],
		queryFn: async () => {
			const { receive } = await PushNotifications.checkPermissions();

			if (receive === "prompt" || receive === "prompt-with-rationale") {
				const { receive } = await PushNotifications.requestPermissions();
				return receive;
			}

			return receive;
		},
		enabled: native,
		placeholderData: "denied" as const,
		meta: {
			cacheTime: 0
		}
	});

	const pushRegistrationIds = useMemo(() => {
		if (!session) return [];
		if (platform === "apple") return session.user.apnsTokens ?? [];
		if (platform === "android") return session.user.fcmTokens ?? [];
		return [];
	}, [platform, session]);

	useQuery({
		queryKey: ["notifications-listeners", { userId: session?.user.id, status, pushRegistrationIds }] as const,
		queryFn: async ({ queryKey: [, { status, pushRegistrationIds }] }) => {
			if (status !== "granted") return null;

			const registrationListener = await PushNotifications.addListener(
				"registration",
				async ({ value: newPushRegistrationId }) => {
					if (
						!session
						|| session.sudoerId
						|| platform === "web"
						|| pushRegistrationIds.includes(newPushRegistrationId)
					)
						return;

					await Promise.all([
						registrationListener.remove(),
						registrationErrorListener.remove()
					]);

					await User.addPushToken(session.user.id, {
						type: platform === "apple" ? "apns" : "fcm",
						token: newPushRegistrationId
					});
				}
			);

			const registrationErrorListener = await PushNotifications.addListener(
				"registrationError",
				async ({ error }) => {
					console.error("push registration error", {
						platform,
						pushRegistrationIds,
						error
					});

					await Promise.all([
						registrationListener.remove(),
						registrationErrorListener.remove()
					]);
				}
			);

			await PushNotifications.register();
			return null;
		},
		placeholderData: null,
		enabled: native,
		meta: {
			cacheTime: 0
		}
	});

	return (
		<NotificationContext
			value={useMemo<NotificationContext>(
				() => ({ status }),
				[status]
			)}
		>
			<>
				{children}
			</>
		</NotificationContext>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
	return use(NotificationContext);
}

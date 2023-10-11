"use client";

import {
	PermissionStatus,
	PushNotifications
} from "@capacitor/push-notifications";
import {
	PropsWithChildren,
	createContext,
	use,
	useContext,
	useEffect,
	useMemo,
	useState
} from "react";

import { api } from "~/api";

import { useDevice } from "./use-device";
import { useToast } from "./use-toast";
import { useSession } from "./use-session";
export interface NotificationContext {
	status: PermissionStatus["receive"];
	pushRegistrationId?: string;
}

const NotificationContext = createContext({} as NotificationContext);

export function NotificationProvider({ children }: PropsWithChildren) {
	const [pushRegistrationId, setPushRegistrationId] = useState<string>();
	const { platform, native } = useDevice();
	const [session] = useSession();
	const toasts = useToast();

	const status = use(
		useMemo(async () => {
			// We can't use push notifications in the browser or on the server.
			if (!native || typeof window === "undefined") return "denied";

			const { receive } = await PushNotifications.checkPermissions();
			if (receive === "prompt" || receive === "prompt-with-rationale") {
				const { receive } = await PushNotifications.requestPermissions();
				return receive;
			}

			return receive;
		}, [native])
	);

	useEffect(() => {
		if (status !== "granted") return;

		const registrationListener = PushNotifications.addListener(
			"registration",
			async (token) => {
				setPushRegistrationId(token.value);

				if (!session) return;
				if (platform === "ios" && token.value !== session.user.apnsToken)
					await api.user.updatePushTokens(session.user.id, {
						body: {
							apnsToken: token.value,
							fcmToken: session.user.fcmToken
						}
					});
				else if (
					platform === "android" &&
					token.value !== session.user.fcmToken
				)
					await api.user.updatePushTokens(session.user.id, {
						body: {
							apnsToken: session.user.apnsToken,
							fcmToken: token.value
						}
					});
			}
		);

		const errorListener = PushNotifications.addListener(
			"registrationError",
			({ error }) => {
				console.error("Error on push notification registration:", error);
				setPushRegistrationId(void 0);
			}
		);

		void PushNotifications.register();

		return () => {
			void registrationListener.remove();
			void errorListener.remove();
		};
	}, [platform, session, status, toasts.addError]);

	const value = useMemo<NotificationContext>(
		() => ({
			status,
			pushRegistrationId
		}),
		[status, pushRegistrationId]
	);

	return (
		<NotificationContext.Provider value={value}>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotifications() {
	return useContext(NotificationContext);
}

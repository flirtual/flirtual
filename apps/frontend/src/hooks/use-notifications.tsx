"use client";

import {
	PermissionStatus,
	PushNotifications
} from "@capacitor/push-notifications";
import {
	PropsWithChildren,
	createContext,
	// eslint-disable-next-line import/named
	use,
	useContext,
	useEffect,
	useMemo,
	useState
} from "react";
import { LocalNotifications } from "@capacitor/local-notifications";

import { tinySimpleHash, tryJsonParse } from "~/utilities";

import { useDevice } from "./use-device";
import { useToast } from "./use-toast";
export interface NotificationContext {
	status: PermissionStatus["receive"];
	pushRegistrationId?: string;
}

const NotificationContext = createContext({} as NotificationContext);

export function NotificationProvider({ children }: PropsWithChildren) {
	const [pushRegistrationId, setPushRegistrationId] = useState<string>();
	const { native } = useDevice();
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
			(token) => setPushRegistrationId(token.value)
		);

		const errorListener = PushNotifications.addListener(
			"registrationError",
			({ error }) => {
				console.error("Error on push notification registration:", error);
				setPushRegistrationId(void 0);
			}
		);

		void LocalNotifications.registerActionTypes({
			types: [
				{
					id: "message",
					actions: [
						{
							id: "reply",
							title: "Reply",
							input: true,
							inputButtonTitle: "Send",
							inputPlaceholder: "Send a message"
						}
					]
				}
			]
		});

		// https://capacitorjs.com/docs/apis/push-notifications#android-1
		void PushNotifications.addListener(
			"pushNotificationReceived",
			async ({ data }) => {
				// https://talkjs.com/docs/Features/Notifications/Mobile_Push_Notifications/
				if ("talkjs" in data) {
					const { conversation, message } = tryJsonParse<{
						conversation?: { id: string };
						message?: { id: string };
					}>(data.talkjs, {});

					if (!conversation || !message) return;

					await LocalNotifications.schedule({
						notifications: [
							{
								id: tinySimpleHash(message.id),
								group: conversation.id,
								actionTypeId: "message",
								title: data.title,
								body: data.message
							}
						]
					}).catch(toasts.addError);
				}
			}
		);

		void PushNotifications.register();

		return () => {
			void registrationListener.remove();
			void errorListener.remove();
		};
	}, [status, toasts.addError]);

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

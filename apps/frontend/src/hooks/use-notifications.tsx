import { App } from "@capacitor/app";
import { registerPlugin } from "@capacitor/core";
import {

	PushNotifications
} from "@capacitor/push-notifications";
import type { PermissionStatus } from "@capacitor/push-notifications";
import {
	createContext,

	use,
	useEffect,
	useMemo
} from "react";
import type { PropsWithChildren } from "react";

import { User } from "~/api/user";
import { queryClient, useQuery } from "~/query";

import { device, useDevice } from "./use-device";
import { useOptionalSession } from "./use-session";

export interface NotificationContext {
	status: PermissionStatus["receive"];
}

const NotificationSettings = registerPlugin<{
	areEnabled: () => Promise<{ enabled: boolean }>;
}>("NotificationSettings");

const permissionsKey = ["notifications-permissions"] as const;

// eslint-disable-next-line react-refresh/only-export-components
export function setNotificationPermission(status: PermissionStatus["receive"]) {
	queryClient.setQueryData<PermissionStatus["receive"]>(permissionsKey, status);
}

async function getNotificationPermission(): Promise<PermissionStatus["receive"]> {
	const { receive } = await PushNotifications.checkPermissions();
	if (receive !== "granted" || !device.native || !device.android) return receive;

	const { enabled } = await NotificationSettings
		.areEnabled()
		.catch(() => ({ enabled: true }));

	return enabled ? "granted" : "denied";
}

// eslint-disable-next-line react-refresh/only-export-components
export async function requestNotificationPermission() {
	const status = await getNotificationPermission();

	if (status !== "prompt" && status !== "prompt-with-rationale") {
		setNotificationPermission(status);
		return;
	}

	await PushNotifications.requestPermissions();
	setNotificationPermission(await getNotificationPermission());
}

let promptedThisSession = false;

// eslint-disable-next-line react-refresh/only-export-components
export function useNotificationPrompt() {
	const { native } = useDevice();
	const session = useOptionalSession();

	const wantsNotifications = Object
		.values(session?.user.preferences?.pushNotifications ?? {})
		.some(Boolean);

	useEffect(() => {
		if (!native || !wantsNotifications || promptedThisSession) return;
		promptedThisSession = true;

		void requestNotificationPermission();
	}, [native, wantsNotifications]);
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
		queryKey: permissionsKey,
		queryFn: getNotificationPermission,
		enabled: native,
		placeholderData: "denied" as const,
		meta: {
			cacheTime: 0
		}
	});

	useNotificationPrompt();

	// The user may have changed the permission in system settings while we were
	// in the background, so re-check whenever we come back.
	useEffect(() => {
		if (!native) return;

		const listener = App.addListener("appStateChange", async ({ isActive }) => {
			if (!isActive) return;
			setNotificationPermission(await getNotificationPermission());
		});

		return () => void listener.then((listener) => listener.remove());
	}, [native]);

	const pushRegistrationIds = useMemo(() => {
		if (!session) return [];
		if (platform === "apple") return session.user.apnsTokens ?? [];
		if (platform === "android") return session.user.fcmTokens ?? [];
		return [];
	}, [platform, session]);

	useQuery({
		queryKey: ["notifications-action-listener"] as const,
		queryFn: async () => {
			await PushNotifications.addListener(
				"pushNotificationActionPerformed",
				({ notification }) => {
					const data = notification.data as
						| {
							url?: string;
							talkjs?: { message?: { conversationId?: string } } | string;
						}
						| undefined;

					let url = data?.url ?? null;

					if (!url && data?.talkjs) {
						try {
							const talkjs = typeof data.talkjs === "string"
								? (JSON.parse(data.talkjs) as { message?: { conversationId?: string } })
								: data.talkjs;
							if (talkjs.message?.conversationId)
								url = `flirtual://matches/${talkjs.message.conversationId}`;
						}
						catch {}
					}

					if (!url) return;
					location.href = url.replace(/^flirtual:\/\//, "/");
				}
			);
			return null;
		},
		placeholderData: null,
		enabled: native,
		meta: {
			cacheTime: 0
		}
	});

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

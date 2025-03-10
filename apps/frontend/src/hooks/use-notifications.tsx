"use client";

import {
	type PermissionStatus,
	PushNotifications
} from "@capacitor/push-notifications";
import { useRouter } from "next/navigation";
import {
	createContext,
	type PropsWithChildren,
	use,
	useMemo
} from "react";
import useSWR from "swr";

import { User } from "~/api/user";

import { useDevice } from "./use-device";
import { useSession } from "./use-session";

export interface NotificationContext {
	status: PermissionStatus["receive"];
}

const NotificationContext = createContext({} as NotificationContext);

export function NotificationProvider({ children }: PropsWithChildren) {
	const { platform, native } = useDevice();
	const [session] = useSession();
	const router = useRouter();

	useSWR("notifications-reset-count", () => {
		if (
			!session?.user.id
			|| document.visibilityState === "hidden"
			|| !session.user.pushCount
		)
			return;
		return User.resetPushCount(session.user.id);
	});

	const { data: status = "denied" } = useSWR(
		native && "notification-permissions",
		async () => {
			const { receive } = await PushNotifications.checkPermissions();
			if (receive === "prompt" || receive === "prompt-with-rationale") {
				const { receive } = await PushNotifications.requestPermissions();
				return receive;
			}

			return receive;
		}
	);

	const pushRegistrationIds = useMemo(() => {
		if (!session) return [];
		if (platform === "apple") return session.user.apnsTokens ?? [];
		if (platform === "android") return session.user.fcmTokens ?? [];
		return [];
	}, [platform, session]);

	useSWR(
		native && [
			"notifications-listeners",
			{ userId: session?.user.id, status, pushRegistrationIds }
		],
		async ([, { status, pushRegistrationIds }]) => {
			if (status !== "granted") return;

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
					router.refresh();
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
		}
	);

	return (
		<NotificationContext
			value={useMemo<NotificationContext>(
				() => ({ status }),
				[status]
			)}
		>
			{children}
		</NotificationContext>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
	return use(NotificationContext);
}

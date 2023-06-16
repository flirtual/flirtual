import {
	ActionPerformed,
	PushNotificationSchema,
	PushNotifications,
	Token
} from "@capacitor/push-notifications";

export function usePushNotifications() {
	void PushNotifications.requestPermissions().then(console.log);
}

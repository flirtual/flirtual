import { fetch, FetchOptions } from "..";

export const PrivacyPreferenceOptions = ["everyone", "matches", "me"] as const;
export type PrivacyPreferenceOption = typeof PrivacyPreferenceOptions[number];

export interface PrivacyPreferences {
	analytics: boolean;
	personality: PrivacyPreferenceOption;
	connections: PrivacyPreferenceOption;
	sexuality: PrivacyPreferenceOption;
	country: PrivacyPreferenceOption;
	kinks: PrivacyPreferenceOption;
}

export interface NotificationPreferences {
	matches: boolean;
	messages: boolean;
	likes: boolean;
	newsletter: boolean;
}

export interface Preferences {
	emailNotifications: NotificationPreferences;
	privacy: PrivacyPreferences;
}

export type UpdatePrivacyPreferencesOptions = Partial<PrivacyPreferences>;

export async function updatePrivacy(
	userId: string,
	body: UpdatePrivacyPreferencesOptions,
	options: FetchOptions = {}
) {
	return fetch<PrivacyPreferences>("post", `users/${userId}/preferences/privacy`, {
		...options,
		body
	});
}

export type UpdateNotificationsPreferencesOptions = Partial<PrivacyPreferences>;

export async function updateNotifications(
	userId: string,
	body: UpdateNotificationsPreferencesOptions,
	options: FetchOptions = {}
) {
	return fetch<PrivacyPreferences>("post", `users/${userId}/preferences/notifications`, {
		...options,
		body
	});
}

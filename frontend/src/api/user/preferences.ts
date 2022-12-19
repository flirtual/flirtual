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
	nsfw: boolean;
	emailNotifications: NotificationPreferences;
	privacy: PrivacyPreferences;
}

export type UpdatePreferences = Partial<Pick<Preferences, "nsfw">>;

export async function update(userId: string, body: UpdatePreferences, options: FetchOptions = {}) {
	return fetch<Preferences>("post", `users/${userId}/preferences`, {
		...options,
		body
	});
}

export type UpdatePrivacyPreferences = Partial<PrivacyPreferences>;

export async function updatePrivacy(
	userId: string,
	body: UpdatePrivacyPreferences,
	options: FetchOptions = {}
) {
	return fetch<PrivacyPreferences>("post", `users/${userId}/preferences/privacy`, {
		...options,
		body
	});
}

export type UpdateNotificationsPreferences = Partial<PrivacyPreferences>;

export async function updateNotifications(
	userId: string,
	body: UpdateNotificationsPreferences,
	options: FetchOptions = {}
) {
	return fetch<PrivacyPreferences>("post", `users/${userId}/preferences/notifications`, {
		...options,
		body
	});
}

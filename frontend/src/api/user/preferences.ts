import { fetch, NarrowFetchOptions } from "../exports";

export const PrivacyPreferenceOptions = ["everyone", "matches", "me"] as const;
export type PrivacyPreferenceOption = (typeof PrivacyPreferenceOptions)[number];

export const PreferenceThemes = ["light", "dark", "system"] as const;
export type PreferenceTheme = (typeof PreferenceThemes)[number];

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
	theme: PreferenceTheme;
	emailNotifications: NotificationPreferences;
	privacy: PrivacyPreferences;
}

export async function update(
	userId: string,
	options: NarrowFetchOptions<Partial<Pick<Preferences, "nsfw" | "theme">>>
) {
	return fetch<Preferences>("post", `users/${userId}/preferences`, options);
}

export async function updatePrivacy(
	userId: string,
	options: NarrowFetchOptions<Partial<PrivacyPreferences>>
) {
	return fetch<PrivacyPreferences>("post", `users/${userId}/preferences/privacy`, options);
}

export async function updateNotifications(
	userId: string,
	options: NarrowFetchOptions<Partial<PrivacyPreferences>>
) {
	return fetch<PrivacyPreferences>("post", `users/${userId}/preferences/notifications`, options);
}

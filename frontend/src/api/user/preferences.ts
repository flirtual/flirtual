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

export interface Preferences {
	emailNotifications: {
		matches: boolean;
		messages: boolean;
		likes: boolean;
		newsletter: boolean;
	};
	privacy: PrivacyPreferences;
}

export type UpdatePrivacyPreferencesOptions = Partial<PrivacyPreferences>;

export async function updatePrivacy(
	userId: string,
	body: UpdatePrivacyPreferencesOptions,
	options: FetchOptions = {}
) {
	await fetch("post", `users/${userId}/preferences/privacy`, { ...options, body });
}

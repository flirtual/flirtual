import { api } from "../common";

export const PrivacyPreferenceOptions = ["everyone", "matches", "me"] as const;
export type PrivacyPreferenceOption = (typeof PrivacyPreferenceOptions)[number];

export const PreferenceThemes = ["light", "dark", "system"] as const;
export type PreferenceTheme = (typeof PreferenceThemes)[number];

export const PreferenceLanguages = ["en", "de", "es", "fr", "ja", "ko", "nl", "pt", "pt-BR", "ru", "sv"] as const;
export type PreferenceLanguage = (typeof PreferenceLanguages)[number];

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
	reminders: boolean;
	newsletter: boolean;
}

export interface Preferences {
	nsfw: boolean;
	theme: PreferenceTheme;
	language?: PreferenceLanguage;
	emailNotifications: NotificationPreferences;
	pushNotifications: NotificationPreferences;
	privacy: PrivacyPreferences;
}

export const Preferences = {
	update(
		userId: string,
		options: Partial<Pick<Preferences, "language" | "nsfw" | "theme">>
	) {
		return api
			.url(`users/${userId}/preferences`)
			.json(options)
			.post()
			.json<Preferences>();
	},
	updatePrivacy(userId: string, options: Partial<PrivacyPreferences>) {
		return api
			.url(`users/${userId}/preferences/privacy`)
			.json(options)
			.post()
			.json<PrivacyPreferences>();
	},
	updateNotifications(
		userId: string,
		options: {
			email: Partial<NotificationPreferences>;
			push: Partial<NotificationPreferences>;
		}
	) {
		return api
			.url(`users/${userId}/preferences/notifications`)
			.json(options)
			.post()
			.json<{
			email: NotificationPreferences;
			push: NotificationPreferences;
		}>();
	}
};

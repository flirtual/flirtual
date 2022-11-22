import { LanguageCode } from "~/countries";

import { DatedModel, UuidModel } from "./common";
import { Profile } from "./profile";

import { fetch, FetchOptions } from ".";

export type UserTags = "admin" | "moderator" | "beta_tester" | "debugger" | "verified";

export type User = UuidModel &
	DatedModel & {
		email: string;
		username: string;
		language: LanguageCode | null;
		bornAt: string | null;
		preferences: Preferences;
		profile: Profile;
		subscription: null;
		tags: Array<UserTags>;
		updatedAt: string;
		createdAt: string;
	};

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

export interface CreateUserOptions {
	username: string;
	email: string;
	password: string;
	notifications: boolean;
	serviceAgreement: boolean;
}

export async function create(body: CreateUserOptions, options: FetchOptions = {}) {
	return fetch<User>("post", "users", { ...options, body });
}

export async function get(userId: string, options: FetchOptions = {}) {
	return fetch<User>("get", `users/${userId}`, options);
}

export async function update(userId: string, body: unknown, options: FetchOptions = {}) {
	await fetch("post", `users/${userId}`, { ...options, body });
}

import { CountryCode, LanguageCode } from "~/countries";

import { DatedModel, UpdatedAtModel } from "./common";

import { fetch, FetchOptions } from ".";

export type ProfilePreferenceGender = "men" | "women" | "other";

export type ProfilePreferences = UpdatedAtModel & {
	agemin: number | null;
	agemax: number | null;
	gender: Array<ProfilePreferenceGender>;
	kinks: Array<string>;
};

export type ProfileImage = DatedModel & {
	externalId: string;
	scanned: boolean;
};

export type ProfileGender = "man" | "woman" | "other";

export type Profile = UpdatedAtModel & {
	displayName: string | null;
	biography: string | null;
	country: CountryCode | null;
	openness: number;
	conscientiousness: number;
	agreeableness: number;
	gender: Array<ProfileGender>;
	sexuality: Array<string>;
	games: Array<string>;
	languages: Array<LanguageCode>;
	platforms: Array<string>;
	interests: Array<string>;
	preferences: ProfilePreferences;
	custom_weights: null;
	images: Array<ProfileImage>;
};

type ProfileUpdate = Partial<
	Pick<
		Profile,
		| "displayName"
		| "biography"
		| "country"
		| "gender"
		| "sexuality"
		| "games"
		| "sexuality"
		| "platforms"
		| "interests"
	>
>;

export async function update(userId: string, body: ProfileUpdate, options: FetchOptions = {}) {
	await fetch("post", `users/${userId}/profile`, { ...options, body });
}

export async function updatePreferences(userId: string, body: unknown, options: FetchOptions = {}) {
	await fetch("post", `users/${userId}/profile/preferences`, { ...options, body });
}

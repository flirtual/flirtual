import { CountryCode, LanguageCode } from "~/countries";

import { DatedModel, UpdatedAtModel } from "../../common";
import { fetch, FetchOptions } from "../..";
import { User } from "../user";

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

export function url(user: User) {
	return `/${user.id}`;
}

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

export interface ProfilePersonality {
	question0: boolean | null;
	question1: boolean | null;
	question2: boolean | null;
	question3: boolean | null;
	question4: boolean | null;
	question5: boolean | null;
	question6: boolean | null;
	question7: boolean | null;
	question8: boolean | null;
}

export async function getPersonality(userId: string, options: FetchOptions = {}) {
	return fetch<ProfilePersonality>("get", `users/${userId}/profile/personality`, { ...options });
}

export type PersonalityUpdate = ProfilePersonality;

export async function updatePersonality(
	userId: string,
	body: PersonalityUpdate,
	options: FetchOptions = {}
) {
	await fetch("post", `users/${userId}/profile/personality`, { ...options, body });
}

export async function updatePreferences(userId: string, body: unknown, options: FetchOptions = {}) {
	await fetch("post", `users/${userId}/profile/preferences`, { ...options, body });
}

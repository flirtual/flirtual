import { CountryCode, LanguageCode } from "~/countries";
import { AttributeCollection } from "~/api/attributes";

import { UpdatedAtModel } from "../../common";
import { fetch, FetchOptions } from "../..";

import { ProfileImage } from "./images";

export type ProfilePreferenceGender = "men" | "women" | "other";

export type ProfilePreferences = UpdatedAtModel & {
	agemin: number | null;
	agemax: number | null;
	gender: Array<ProfilePreferenceGender>;
	kinks: Array<string>;
};

export type ProfileGender = "man" | "woman" | "other";

export interface ProfileCustomWeights {
	country: number;
	monopoly: number;
	games: number;
	defaultInterests: number;
	customInterests: number;
	personality: number;
	serious: number;
	domsub: number;
	kinks: number;
	likes: number;
}

export const DefaultProfileCustomWeights = Object.freeze<ProfileCustomWeights>({
	country: 1,
	customInterests: 1,
	defaultInterests: 1,
	domsub: 1,
	games: 1,
	kinks: 1,
	likes: 1,
	monopoly: 1,
	personality: 1,
	serious: 1
});

export type Profile = UpdatedAtModel & {
	displayName: string | null;
	biography: string | null;
	country: CountryCode | null;
	openness: number;
	conscientiousness: number;
	agreeableness: number;
	gender: Array<ProfileGender>;
	sexuality: AttributeCollection;
	games: AttributeCollection;
	languages: Array<LanguageCode>;
	platforms: AttributeCollection;
	interests: AttributeCollection;
	preferences: ProfilePreferences;
	customWeights: ProfileCustomWeights | null;
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
	return fetch<Profile>("post", `users/${userId}/profile`, { ...options, body });
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
	return fetch<Profile>("post", `users/${userId}/profile/personality`, { ...options, body });
}

export async function updatePreferences(userId: string, body: unknown, options: FetchOptions = {}) {
	return fetch<ProfilePreferences>("post", `users/${userId}/profile/preferences`, {
		...options,
		body
	});
}

export type UpdateCustomWeightOptions = Partial<ProfileCustomWeights>;

export async function updateCustomWeights(
	userId: string,
	body: UpdateCustomWeightOptions,
	options: FetchOptions = {}
) {
	return fetch<Profile>("post", `users/${userId}/profile/custom-weights`, { ...options, body });
}

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
	displayName?: string;
	biography?: string;
	new?: boolean;
	country?: CountryCode;
	openness: number;
	conscientiousness: number;
	agreeableness: number;
	gender: AttributeCollection;
	sexuality: AttributeCollection;
	games: AttributeCollection;
	languages: Array<LanguageCode>;
	platforms: AttributeCollection;
	interests: AttributeCollection;
	preferences: ProfilePreferences;
	customWeights?: ProfileCustomWeights;
	images: Array<ProfileImage>;
};

type ProfileUpdate = Partial<
	Pick<Profile, "displayName" | "biography" | "new" | "country" | "languages">
> & {
	gender?: Array<string>;
	sexuality?: Array<string>;
	games?: Array<string>;
	interests?: Array<string>;
};

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

export const personalityQuestionLabels = [
	"I plan my life out",
	"Rules are important to follow",
	"I daydream a lot",
	"The truth is more important than people's feelings",
	"I often do spontaneous things",
	"Deep down most people are good people",
	"I love helping people",
	"I dislike it when things change",
	"I find many things beautiful"
];

export const DefaultProfilePersonality = Object.freeze<ProfilePersonality>(
	Object.fromEntries(
		personalityQuestionLabels.map((_, questionIdx) => [`question${questionIdx}`, null])
	) as unknown as ProfilePersonality
);

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

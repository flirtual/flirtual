import { AttributeCollection } from "~/api/attributes";
import { GenderAttributeCollection } from "~/hooks/use-gender-list";
import { KinkAttributeCollection } from "~/hooks/use-kink-list";

import { UpdatedAtModel } from "../../common";
import { fetch, FetchOptions } from "../..";

import { ProfileImage } from "./images";
import { ProfileCustomWeights } from "./custom-weights";

export type ProfilePreferences = UpdatedAtModel & {
	agemin?: number | null;
	agemax?: number | null;
	gender: GenderAttributeCollection;
	kinks: KinkAttributeCollection;
};

export const ProfileDomsubList = ["dominant", "submissive", "switch"] as const;
export type ProfileDomsub = (typeof ProfileDomsubList)[number];

export const ProfileMonopolyList = ["monogamous", "polygamous"] as const;
export type ProfileMonopoly = (typeof ProfileMonopolyList)[number];

export type Profile = Partial<UpdatedAtModel> & {
	displayName?: string;
	biography?: string;
	new?: boolean;
	serious?: boolean;
	domsub?: ProfileDomsub;
	monopoly?: ProfileDomsub;
	country?: string;
	openness?: number;
	conscientiousness?: number;
	agreeableness?: number;
	gender: GenderAttributeCollection;
	sexuality?: AttributeCollection;
	kinks?: KinkAttributeCollection;
	games: AttributeCollection;
	languages: Array<string>;
	platforms: AttributeCollection;
	interests: AttributeCollection;
	preferences: ProfilePreferences;
	customWeights?: ProfileCustomWeights;
	images: Array<ProfileImage>;
};

type ProfileUpdate = Partial<
	Pick<
		Profile,
		"displayName" | "biography" | "new" | "domsub" | "country" | "languages" | "serious"
	>
> & {
	gender?: Array<string>;
	kinks?: Array<string>;
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

export type UpdateProfilePersonality = ProfilePersonality;

export async function updatePersonality(
	userId: string,
	body: UpdateProfilePersonality,
	options: FetchOptions = {}
) {
	return fetch<Profile>("post", `users/${userId}/profile/personality`, { ...options, body });
}

export type UpdateProfilePreferences = Partial<
	Pick<ProfilePreferences, "agemin" | "agemax"> & { gender: Array<string> }
>;

export async function updatePreferences(
	userId: string,
	body: UpdateProfilePreferences,
	options: FetchOptions = {}
) {
	return fetch<ProfilePreferences>("post", `users/${userId}/profile/preferences`, {
		...options,
		body
	});
}

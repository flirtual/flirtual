import { PartialAttributeCollection } from "~/api/attributes";

import { UpdatedAtModel } from "../../common";
import { fetch, NarrowFetchOptions } from "../..";

import { ProfileImage } from "./images";
import { ProfileCustomWeights } from "./custom-weights";

export type ProfilePreferences = UpdatedAtModel & {
	agemin?: number;
	agemax?: number;
	attributes: PartialAttributeCollection;
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
	languages: Array<string>;
	attributes: PartialAttributeCollection;
	preferences?: ProfilePreferences;
	customWeights?: ProfileCustomWeights;
	images: Array<ProfileImage>;
};

export async function update(
	userId: string,
	options: NarrowFetchOptions<
		Partial<
			Pick<
				Profile,
				"displayName" | "biography" | "new" | "domsub" | "country" | "languages" | "serious"
			>
		> & {
			attributes?: Array<string>;
		}
	>
) {
	return fetch<Profile>("post", `users/${userId}/profile`, options);
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

export async function getPersonality(
	userId: string,
	options: NarrowFetchOptions = {}
): Promise<ProfilePersonality> {
	return fetch("get", `users/${userId}/profile/personality`, options);
}

export async function updatePersonality(
	userId: string,
	options: NarrowFetchOptions<ProfilePersonality>
) {
	return fetch<Profile>("post", `users/${userId}/profile/personality`, options);
}

export async function updatePreferences(
	userId: string,
	options: NarrowFetchOptions<{
		agemin?: number | null;
		agemax?: number | null;
		attributes?: Array<string>;
	}>
) {
	return fetch<ProfilePreferences>("post", `users/${userId}/profile/preferences`, options);
}

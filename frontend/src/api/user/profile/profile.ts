import { snakeCase } from "change-case";

import { AttributeType, PartialAttributeCollection } from "~/api/attributes";

import { UpdatedAtModel } from "../../common";
import { fetch, NarrowFetchOptions } from "../../exports";

import { ProfileImage } from "./images";
import { ProfileCustomWeights } from "./custom-weights";

export type ProfilePreferences = UpdatedAtModel & {
	agemin?: number;
	agemax?: number;
	attributes: PartialAttributeCollection;
};

export const ProfileDomsubList = ["dominant", "submissive", "switch"] as const;
export type ProfileDomsub = (typeof ProfileDomsubList)[number];

export const ProfileMonopolyList = ["monogamous", "nonmonogamous"] as const;
export const ProfileMonopolyLabel = {
	monogamous: "Monogamous",
	nonmonogamous: "Non-monogamous"
} as const;
export type ProfileMonopoly = (typeof ProfileMonopolyList)[number];

export type Profile = Partial<UpdatedAtModel> & {
	displayName?: string;
	biography?: string;
	new?: boolean;
	serious?: boolean;
	domsub?: ProfileDomsub;
	monopoly?: ProfileMonopoly;
	country?: string;
	vrchat?: string;
	discord?: string;
	openness?: number;
	conscientiousness?: number;
	agreeableness?: number;
	languages: Array<string>;
	attributes: PartialAttributeCollection;
	customInterests: Array<string>;
	preferences?: ProfilePreferences;
	customWeights?: ProfileCustomWeights;
	images: Array<ProfileImage>;
	resetLoveAt?: string;
	resetFriendAt?: string;
};

export const ProfileAttributes = [
	"gender",
	"sexuality",
	"kink",
	"game",
	"platform",
	"interest"
] as const;

export type ProfileAttribute = (typeof ProfileAttributes)[number];

export type UpdateProfileBody = Partial<
	Pick<
		Profile,
		| "displayName"
		| "biography"
		| "new"
		| "country"
		| "languages"
		| "serious"
		| "customInterests"
		| "vrchat"
		| "discord"
	>
> & {
	[K in ProfileAttribute as `${K}Id`]?: Array<string>;
} & {
	domsub?: ProfileDomsub | "none";
	monopoly?: ProfileMonopoly | "none";
};

export async function update(
	userId: string,
	options: NarrowFetchOptions<
		UpdateProfileBody,
		| {
				required?: Array<keyof UpdateProfileBody>;
		  }
		| undefined
	>
) {
	return fetch<Profile>("post", `users/${userId}/profile`, {
		...options,
		query: {
			required: Array.isArray(options.query?.required)
				? options.query?.required.map((key) => snakeCase(key))
				: undefined
		}
	});
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ProfilePersonality = {
	question0: boolean | null;
	question1: boolean | null;
	question2: boolean | null;
	question3: boolean | null;
	question4: boolean | null;
	question5: boolean | null;
	question6: boolean | null;
	question7: boolean | null;
	question8: boolean | null;
};

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
	options: NarrowFetchOptions<
		{
			agemin?: number | null;
			agemax?: number | null;
			attributes?: Array<string>;
		},
		| {
				required?: Array<"agemin" | "agemax">;
				requiredAttributes?: Array<AttributeType>;
		  }
		| undefined
	>
) {
	return fetch<ProfilePreferences>("post", `users/${userId}/profile/preferences`, {
		...options,
		query: {
			required: Array.isArray(options.query?.required)
				? options.query?.required.map((key) => snakeCase(key))
				: undefined,
			requiredAttributes: Array.isArray(options.query?.requiredAttributes)
				? options.query?.requiredAttributes.map((key) => snakeCase(key))
				: undefined
		}
	});
}

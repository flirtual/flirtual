import { snakeCase } from "change-case";

import { fetch, type NarrowFetchOptions } from "../../exports";

import type {
	AttributeType,
	PartialAttributeCollection
} from "~/api/attributes";
import type { UpdatedAtModel } from "../../common";
import type { ProfileImage } from "./images";
import type { ProfilePrompt } from "./prompts";
import type { ProfileCustomWeights } from "./custom-weights";

export type ProfilePreferences = UpdatedAtModel & {
	agemin?: number;
	agemax?: number;
	attributes: PartialAttributeCollection;
};

export const ProfileRelationshipList = [
	"serious",
	"vr",
	"hookups",
	"friends"
] as const;
export const ProfileRelationshipLabel = {
	serious: "Serious dating (meet in-person eventually)",
	vr: "Casual dating (VR-only dating)",
	hookups: "Casual fun",
	friends: "New friends"
};
export type ProfileRelationship = (typeof ProfileRelationshipList)[number];

export const ProfileDomsubList = ["dominant", "submissive", "switch"] as const;
export type ProfileDomsub = (typeof ProfileDomsubList)[number];

export const ProfileMonopolyList = ["monogamous", "nonmonogamous"] as const;
export const ProfileMonopolyLabel = {
	monogamous: "Monogamous",
	nonmonogamous: "Non-monogamous"
};
export type ProfileMonopoly = (typeof ProfileMonopolyList)[number];

export type Profile = Partial<UpdatedAtModel> & {
	displayName?: string;
	biography?: string;
	new?: boolean;
	relationships: Array<ProfileRelationship>;
	domsub?: ProfileDomsub;
	monopoly?: ProfileMonopoly;
	country?: string;
	vrchat?: string | null;
	discord?: string | null;
	facetime?: string | null;
	playlist?: string | null;
	openness?: number;
	conscientiousness?: number;
	agreeableness?: number;
	languages: Array<string>;
	attributes: PartialAttributeCollection;
	customInterests: Array<string>;
	preferences?: ProfilePreferences;
	customWeights?: ProfileCustomWeights;
	images: Array<ProfileImage>;
	prompts: Array<ProfilePrompt>;
	queueResetLoveAt?: string;
	queueResetFriendAt?: string;
	color_1?: string;
	color_2?: string;
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
		| "relationships"
		| "customInterests"
		| "vrchat"
		| "discord"
		| "facetime"
		| "playlist"
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
	"I daydream a lot",
	"I find many things beautiful",
	"I dislike it when things change",
	"I plan my life out",
	"Rules are important to follow",
	"I often do spontaneous things",
	"Deep down most people are good people",
	"I love helping people",
	"The truth is more important than people's feelings"
];

export const DefaultProfilePersonality = Object.freeze<ProfilePersonality>(
	Object.fromEntries(
		personalityQuestionLabels.map((_, questionIndex) => [
			`question${questionIndex}`,
			null
		])
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

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ProfileColors = {
	color_1: string;
	color_2: string;
};

export async function updateColors(
	userId: string,
	options: NarrowFetchOptions<ProfileColors>
) {
	return fetch<Profile>("post", `users/${userId}/profile/colors`, options);
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
	return fetch<ProfilePreferences>(
		"post",
		`users/${userId}/profile/preferences`,
		{
			...options,
			query: {
				required: Array.isArray(options.query?.required)
					? options.query?.required.map((key) => snakeCase(key))
					: undefined,
				requiredAttributes: Array.isArray(options.query?.requiredAttributes)
					? options.query?.requiredAttributes.map((key) => snakeCase(key))
					: undefined
			}
		}
	);
}

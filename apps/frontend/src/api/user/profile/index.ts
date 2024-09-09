import { snakeCase } from "change-case";

import { api, type UpdatedAtModel } from "../../common";

import { Personality } from "./personality";
import { ProfileImage } from "./images";

import type {
	Attribute,
	AttributeMetadata,
	AttributeType,
	GroupedAttributeCollection
} from "~/api/attributes";

export type ProfilePreferences = UpdatedAtModel & {
	agemin?: number;
	agemax?: number;
	attributes: GroupedAttributeCollection;
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
	attributes: GroupedAttributeCollection;
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

export type UpdateProfileOptions = Partial<
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

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ProfileColors = {
	color_1: string;
	color_2: string;
};

export const CustomWeightList = [
	"country",
	"monopoly",
	"games",
	"defaultInterests",
	"customInterests",
	"personality",
	"relationships",
	"languages",
	"domsub",
	"kinks",
	"likes"
] as const;

export type CustomWeight = (typeof CustomWeightList)[number];

export type ProfileCustomWeights = {
	[K in CustomWeight]: number;
};

export const DefaultProfileCustomWeights = Object.freeze<ProfileCustomWeights>(
	Object.fromEntries(
		CustomWeightList.map((key) => [key, 1])
	) as ProfileCustomWeights
);

export interface ProfilePrompt {
	prompt: string;
	response: string;
}

export type ProfilePromptList = Array<ProfilePrompt>;

export type UpdateProfilePromptOptions = Array<{
	promptId: string;
	response: string;
}>;

export const Profile = {
	Personality,
	Image: ProfileImage,
	update(
		userId: string,
		{
			required,
			...options
		}: UpdateProfileOptions & { required?: Array<keyof UpdateProfileOptions> }
	) {
		return api
			.url(`users/${userId}/profile`)
			.query({
				required: Array.isArray(required)
					? required.map((key) => snakeCase(key))
					: undefined
			})
			.json(options)
			.post()
			.json<Profile>();
	},
	updateCustomWeights(userId: string, options: Partial<ProfileCustomWeights>) {
		return api
			.url(`users/${userId}/profile/custom-weights`)
			.json(options)
			.post()
			.json<Profile>();
	},
	updatePrompts(userId: string, options: UpdateProfilePromptOptions) {
		return api
			.url(`users/${userId}/profile/prompts`)
			.json(options)
			.post()
			.json<ProfilePromptList>();
	},
	updateColors(userId: string, options: ProfileColors) {
		return api
			.url(`users/${userId}/profile/colors`)
			.json(options)
			.post()
			.json<Profile>();
	},
	updatePreferences(
		userId: string,
		{
			required,
			requiredAttributes,
			...options
		}: {
			agemin?: number | null;
			agemax?: number | null;
			attributes?: Array<string>;
			required?: Array<"agemin" | "agemax">;
			requiredAttributes?: Array<AttributeType>;
		}
	) {
		return api
			.url(`users/${userId}/profile/preferences`)
			.query({
				required: Array.isArray(required)
					? required.map((key) => snakeCase(key))
					: undefined,
				requiredAttributes: Array.isArray(requiredAttributes)
					? requiredAttributes.map((key) => snakeCase(key))
					: undefined
			})
			.json(options)
			.post()
			.json<ProfilePreferences>();
	}
};

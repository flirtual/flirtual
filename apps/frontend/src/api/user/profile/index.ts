import { toSnakeCase } from "remeda";

import type {
	AttributeType,
	GroupedAttributeCollection
} from "~/api/attributes";

import { api } from "../../common";
import type { UpdatedAtModel } from "../../common";
import { ProfileImage } from "./images";
import { Personality } from "./personality";

export type ProfilePreferences = {
	agemin?: number;
	agemax?: number;
	attributes: GroupedAttributeCollection;
} & UpdatedAtModel;

export const ProfileRelationshipList = [
	"serious",
	"vr",
	"hookups",
	"friends"
] as const;
export type ProfileRelationship = (typeof ProfileRelationshipList)[number];

export const ProfileDomsubList = ["dominant", "submissive", "switch"] as const;
export type ProfileDomsub = (typeof ProfileDomsubList)[number];

export const ProfileMonopolyList = ["monogamous", "nonmonogamous"] as const;

export type ProfileMonopoly = (typeof ProfileMonopolyList)[number];

export type Profile = {
	displayName?: string;
	biography?: string;
	new?: boolean;
	relationships: Array<ProfileRelationship>;
	domsub?: ProfileDomsub;
	monopoly?: ProfileMonopoly;
	country?: string;
	vrchat?: string | null;
	vrchatName?: string | null;
	discord?: string | null;
	facetime?: string | null;
	playlist?: string | null;
	openness?: number;
	conscientiousness?: number;
	agreeableness?: number;
	languages: Array<string>;
	timezone?: string;
	longitude?: number;
	latitude?: number;
	attributes: GroupedAttributeCollection;
	customInterests: Array<string>;
	preferences?: ProfilePreferences;
	customWeights?: ProfileCustomWeights;
	customFilters?: ProfileCustomFilters;
	images: Array<ProfileImage>;
	prompts: Array<ProfilePrompt>;
	queueResetLoveAt?: string;
	queueResetFriendAt?: string;
	color1?: string;
	color2?: string;
} & Partial<UpdatedAtModel>;

export const ProfileAttributes = [
	"gender",
	"sexuality",
	"kink",
	"game",
	"platform",
	"interest"
] as const;

export type ProfileAttribute = (typeof ProfileAttributes)[number];

export type UpdateProfileOptions = {
	[K in ProfileAttribute as `${K}Id`]?: Array<string>;
} & {
	domsub?: "none" | ProfileDomsub;
	monopoly?: "none" | ProfileMonopoly;
} & Partial<
	Pick<
		Profile,
		| "biography"
		| "country"
		| "customInterests"
		| "discord"
		| "displayName"
		| "facetime"
		| "languages"
		| "new"
		| "playlist"
		| "relationships"
		| "timezone"
		| "vrchat"
	>
>;

// eslint-disable-next-line ts/consistent-type-definitions
export type ProfileColors = {
	color1: string;
	color2: string;
};

export const CustomWeightList = [
	"location",
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

export interface CustomFilter {
	preferred: boolean;
	type: "country" | "game" | "gender" | "interest" | "kink" | "language" | "platform" | "sexuality";
	value: string;
}

export type ProfileCustomFilters = Array<CustomFilter>;

export interface ProfilePrompt {
	promptId: string;
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
		}: { required?: Array<keyof UpdateProfileOptions> } & UpdateProfileOptions
	) {
		return api
			.url(`users/${userId}/profile`)
			.query({
				required: Array.isArray(required)
					? required.map((key) => toSnakeCase(key))
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
	updateCustomFilters(userId: string, options: Partial<ProfileCustomFilters>) {
		return api
			.url(`users/${userId}/profile/custom-filters`)
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
			required?: Array<"agemax" | "agemin">;
			requiredAttributes?: Array<AttributeType>;
		}
	) {
		return api
			.url(`users/${userId}/profile/preferences`)
			.query({
				required: Array.isArray(required)
					? required.map((key) => toSnakeCase(key))
					: undefined,
				requiredAttributes: Array.isArray(requiredAttributes)
					? requiredAttributes.map((key) => toSnakeCase(key))
					: undefined
			})
			.json(options)
			.post()
			.json<ProfilePreferences>();
	},
	updateGeolocation(userId: string, coords: { longitude: number; latitude: number }) {
		return api
			.url(`users/${userId}/profile/geolocation`)
			.json(coords)
			.post()
			.json<{ success: boolean; geolocation: boolean }>();
	},
	deleteGeolocation(userId: string) {
		return api
			.url(`users/${userId}/profile/geolocation`)
			.delete()
			.json<{ success: boolean }>();
	}
};

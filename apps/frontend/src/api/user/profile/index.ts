import { toSnakeCase } from "remeda";

import { api } from "../../common";
import type { UpdatedAtModel } from "../../common";
import { ProfileImage } from "./images";
import { Personality } from "./personality";

export type ProfilePreferences = {
	agemin?: number;
	agemax?: number;
	genders?: Array<string>;
	kinks?: Array<string>;
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
	genders?: Array<string>;
	sexualities?: Array<string>;
	interests?: Array<string>;
	games?: Array<string>;
	platforms?: Array<string>;
	kinks?: Array<string>;
	customInterests: Array<string>;
	preferences?: ProfilePreferences;
	customWeights?: ProfileCustomWeights;
	advancedFilters?: ProfileAdvancedFilters;
	images: Array<ProfileImage>;
	prompts: Array<ProfilePrompt>;
	color1?: string;
	color2?: string;
} & Partial<UpdatedAtModel>;

export const ProfileDataTypes = [
	"gender",
	"sexuality",
	"kink",
	"game",
	"platform",
	"interest"
] as const;

export type ProfileDataType = (typeof ProfileDataTypes)[number];

export type UpdateProfileOptions = {
	[K in ProfileDataType as `${K}Id`]?: Array<string>;
} & {
	// `null` clears one.
	country?: string | null;
	domsub?: ProfileDomsub | null;
	monopoly?: ProfileMonopoly | null;
	timezone?: string | null;
} & Partial<
	Pick<
		Profile,
		| "biography"
		| "customInterests"
		| "discord"
		| "displayName"
		| "facetime"
		| "languages"
		| "new"
		| "playlist"
		| "relationships"
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

export const CustomWeightSteps = [
	0,
	0.25,
	0.5,
	0.75,
	1,
	1.5,
	2,
	3.5,
	5
] as const;

export type ProfileCustomWeights = {
	[K in CustomWeight]: number;
};

export const DefaultProfileCustomWeights = Object.freeze<ProfileCustomWeights>(
	Object.fromEntries(
		CustomWeightList.map((key) => [key, 1])
	) as ProfileCustomWeights
);

export const AdvancedFilterCategories = [
	"gender",
	"sexuality",
	"relationships",
	"monopoly",
	"interest",
	"game",
	"platform",
	"personality",
	"domsub",
	"country",
	"language",
	"kink"
] as const;

export type AdvancedFilterCategory = (typeof AdvancedFilterCategories)[number];

export interface AdvancedFilter {
	kind: "exclude" | "include";
	category: AdvancedFilterCategory;
	value?: string | null;
}

export type ProfileAdvancedFilters = Array<AdvancedFilter>;

export interface ProfilePrompt {
	prompt: string;
	response: string;
}

export type ProfilePromptList = Array<ProfilePrompt>;

export type UpdateProfilePromptOptions = Array<{
	prompt: string;
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
	updateAdvancedFilters(userId: string, options: ProfileAdvancedFilters) {
		return api
			.url(`users/${userId}/profile/advanced-filters`)
			.json(options)
			.post()
			.json<ProfileAdvancedFilters>();
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
			...options
		}: {
			agemin?: number | null;
			agemax?: number | null;
			genders?: Array<string>;
			required?: Array<"agemax" | "agemin" | "genders">;
		}
	) {
		return api
			.url(`users/${userId}/profile/preferences`)
			.query({
				required: Array.isArray(required)
					? required.map((key) => toSnakeCase(key))
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

import { DatedModel, UpdatedAtModel, UuidModel } from "./common";

import { fetch, FetchOptions } from ".";

export type UserTags = "admin" | "moderator" | "beta_tester" | "debugger" | "verified";

export type User = UuidModel &
	DatedModel & {
		email: string;
		username: string;
		bornAt: string | null;
		profile: Profile;
		subscription: null;
		tags: Array<UserTags>;
		updatedAt: string;
		createdAt: string;
	};

export type ProfilePreferences = UpdatedAtModel & {
	agemin: number | null;
	agemax: number | null;
	gender: Array<string>;
	kinks: Array<string>;
};

export type ProfileImage = DatedModel & {
	externalId: string;
	scanned: boolean;
};

export type Profile = UpdatedAtModel & {
	displayName: string | null;
	biography: string | null;
	country: string | null;
	openness: number;
	conscientiousness: number;
	agreeableness: number;
	gender: Array<string>;
	sexuality: Array<string>;
	games: Array<string>;
	languages: Array<string>;
	platforms: Array<string>;
	interests: Array<string>;
	preferences: ProfilePreferences;
	custom_weights: null;
	images: Array<ProfileImage>;
};

export interface CreateUserOptions {
	username: string;
	email: string;
	password: string;
	notifications: boolean;
	serviceAgreement: boolean;
}

export async function create(body: CreateUserOptions, options: FetchOptions = {}) {
	return fetch<User>("post", "users", { ...options, body });
}

export async function get(userId: string, options: FetchOptions = {}) {
	return fetch<User>("get", `users/${userId}`, options);
}

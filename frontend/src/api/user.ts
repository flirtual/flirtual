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

export type Profile = UpdatedAtModel & {
	displayName: string | null;
	biography: string | null;
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

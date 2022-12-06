import { LanguageCode } from "~/countries";

import { DatedModel, UuidModel } from "../common";
import { fetch, FetchOptions } from "..";

import { Profile } from "./profile/profile";
import { Preferences } from "./preferences";
import { Subscription } from "./subscription";

export type UserTags = "admin" | "moderator" | "beta_tester" | "debugger" | "verified";

export type User = UuidModel &
	DatedModel & {
		email: string;
		username: string;
		language: LanguageCode | null;
		bornAt: string | null;
		emailConfirmedAt: string | null;
		deactivatedAt: string | null;
		preferences: Preferences;
		profile: Profile;
		subscription: Subscription | null;
		tags: Array<UserTags>;
		updatedAt: string;
		createdAt: string;
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

export async function update(userId: string, body: unknown, options: FetchOptions = {}) {
	return fetch<User>("post", `users/${userId}`, { ...options, body });
}

export interface UpdateEmailOptions {
	currentPassword: string;
	email: string;
	emailConfirmation: string;
}

export async function updateEmail(
	userId: string,
	body: UpdateEmailOptions,
	options: FetchOptions = {}
) {
	return fetch<User>("post", `users/${userId}/email`, { ...options, body });
}

export interface UpdatePasswordOptions {
	currentPassword: string;
	password: string;
	passwordConfirmation: string;
}

export async function updatePassword(
	userId: string,
	body: UpdatePasswordOptions,
	options: FetchOptions = {}
) {
	return fetch<User>("post", `users/${userId}/password`, { ...options, body });
}

export async function confirmEmail(userId: string, token: string, options: FetchOptions = {}) {
	return fetch<User>("post", `users/${userId}/email/confirm`, {
		...options,
		body: { token }
	});
}

export interface DeactivateOptions {
	currentPassword: string;
}

export async function deactivate(
	userId: string,
	body: DeactivateOptions,
	options: FetchOptions = {}
) {
	return fetch<User>("post", `users/${userId}/deactivate`, { ...options, body });
}

export async function reactivate(userId: string, options: FetchOptions = {}) {
	return fetch<User>("delete", `users/${userId}/deactivate`, options);
}

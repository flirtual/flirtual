import { Expand } from "~/utilities";

import { DatedModel, UuidModel } from "../common";
import { fetch, FetchOptions } from "..";

import { Profile } from "./profile/profile";
import { Preferences } from "./preferences";
import { Subscription } from "./subscription";

export type UserTags = "admin" | "moderator" | "beta_tester" | "debugger" | "verified";

export type User = Expand<
	UuidModel &
		Partial<DatedModel> & {
			email: string;
			username: string;
			language?: string;
			bornAt?: string;
			emailConfirmedAt?: string;
			deactivatedAt?: string;
			preferences?: Preferences;
			profile: Profile;
			subscription?: Subscription;
			tags: Array<UserTags>;
		}
>;

export interface CreateUserOptions {
	username: string;
	email: string;
	password: string;
	notifications: boolean;
	serviceAgreement: boolean;
}

export interface UserVisibility {
	visible: boolean;
	reasons: Array<{
		reason: string;
		to?: string;
	}>;
}

export async function create(body: CreateUserOptions, options: FetchOptions = {}) {
	return fetch<User>("post", "users", { ...options, body });
}

export async function get(userId: string, options: FetchOptions = {}) {
	return fetch<User>("get", `users/${userId}`, options);
}

export async function getByUsername(username: string, options: FetchOptions = {}) {
	return fetch<User>("get", `users/${username}/username`, options);
}

export async function visible(userId: string, options: FetchOptions = {}) {
	return fetch<UserVisibility>("get", `users/${userId}/visible`, options);
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

export async function resendConfirmEmail(userId: string, options: FetchOptions = {}) {
	return fetch("post", `users/${userId}/email/confirm/resend`, {
		...options
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

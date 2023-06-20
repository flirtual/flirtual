import { snakeCase } from "change-case";

import { DatedModel, UuidModel } from "../common";
import { fetch, NarrowFetchOptions } from "../exports";
import { Subscription } from "../subscription";

import { Profile } from "./profile/profile";
import { Preferences } from "./preferences";
import { Relationship } from "./relationship";

export type UserTags =
	| "admin"
	| "moderator"
	| "beta_tester"
	| "debugger"
	| "verified"
	| "legacy_vrlfp";

export type User = UuidModel &
	Partial<DatedModel> & {
		email: string;
		username: string;
		language?: string;
		talkjsId: string;
		talkjsSignature?: string;
		moderatorMessage?: string;
		moderatorNote?: string;
		visible: boolean;
		relationship?: Relationship;
		bornAt?: string;
		activeAt?: string;
		emailConfirmedAt?: string;
		shadowbannedAt?: string;
		bannedAt?: string;
		deactivatedAt?: string;
		preferences?: Preferences;
		profile: Profile;
		subscription?: Subscription;
		tags?: Array<UserTags>;
		//connections?: Array<Connection>;
	};

export function displayName(user: User) {
	return user.profile.displayName || user.username;
}

export async function create(
	options: NarrowFetchOptions<{
		username: string;
		email: string;
		password: string;
		notifications: boolean;
		serviceAgreement: boolean;
		captcha: string;
	}>
) {
	return fetch<User>("post", "users", options);
}

export async function get(userId: string, options: NarrowFetchOptions = {}) {
	return fetch<User>("get", `users/${userId}`, options);
}

export async function bulk(options: NarrowFetchOptions<Array<string>>) {
	return fetch<Array<User>>("post", "users/bulk", options);
}

export async function getByUsername(
	username: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("get", `users/${username}/username`, options);
}

export interface UserVisibility {
	visible: boolean;
	reasons: Array<{
		reason: string;
		to?: string;
	}>;
}

export async function visible(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<UserVisibility>("get", `users/${userId}/visible`, options);
}

export type UpdateUserBody = Partial<Pick<User, "bornAt" | "language">>;

export async function update(
	userId: string,
	options: NarrowFetchOptions<
		UpdateUserBody,
		| {
				required?: Array<keyof UpdateUserBody>;
		  }
		| undefined
	>
) {
	return fetch<User>("post", `users/${userId}`, {
		...options,
		query: {
			required: Array.isArray(options.query?.required)
				? options.query?.required.map((key) => snakeCase(key))
				: undefined
		}
	});
}

export async function updateEmail(
	userId: string,
	options: NarrowFetchOptions<{
		currentPassword: string;
		email: string;
		emailConfirmation: string;
	}>
) {
	return fetch<User>("post", `users/${userId}/email`, options);
}

export async function updatePassword(
	userId: string,
	options: NarrowFetchOptions<{
		currentPassword: string;
		password: string;
		passwordConfirmation: string;
	}>
) {
	return fetch<User>("post", `users/${userId}/password`, options);
}

export async function confirmEmail(
	options: NarrowFetchOptions<{ token: string }>
) {
	return fetch<User>("post", `auth/email/confirm`, options);
}

export async function resendConfirmEmail(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch("delete", `auth/email/confirm`, options);
}

export async function deactivate(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("post", `users/${userId}/deactivate`, options);
}

export async function reactivate(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("delete", `users/${userId}/deactivate`, options);
}

export async function block(userId: string, options: NarrowFetchOptions = {}) {
	return fetch<User>("post", `users/${userId}/block`, options);
}

export async function unblock(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("delete", `users/${userId}/block`, options);
}

export async function suspend(
	userId: string,
	options: NarrowFetchOptions<{
		reasonId: string;
		message: string;
	}>
) {
	return fetch<User>("post", `users/${userId}/suspend`, options);
}

export async function unsuspend(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("delete", `users/${userId}/suspend`, options);
}

export async function warn(
	userId: string,
	options: NarrowFetchOptions<{
		message: string;
	}>
) {
	return fetch<User>("post", `users/${userId}/warn`, options);
}

export async function deleteWarn(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("delete", `users/${userId}/warn`, options);
}

export async function acknowledgeWarn(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("put", `users/${userId}/warn`, options);
}

export async function note(
	userId: string,
	options: NarrowFetchOptions<{
		message: string;
	}>
) {
	return fetch<User>("post", `users/${userId}/note`, options);
}

export async function deleteNote(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("delete", `users/${userId}/note`, options);
}

export { _delete as delete };
async function _delete(
	options: NarrowFetchOptions<{
		reasonId: string;
		comment: string;
		currentPassword: string;
		captcha: string;
	}>
) {
	return fetch<User>("delete", `auth/user`, options);
}

export async function adminDelete(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("delete", `users/${userId}`, options);
}

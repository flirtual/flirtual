import { snakeCase } from "change-case";

import {
	fetch,
	type FetchOptions,
	type NarrowFetchOptions,
	type Paginate,
	type PaginateOptions
} from "../exports";

import type { DatedModel, UuidModel } from "../common";
import type { Subscription } from "../subscription";
import type { Attribute } from "../attributes";
import type { Connection } from "../connections";
import type { Profile } from "./profile/profile";
import type { Preferences } from "./preferences";
import type { Relationship } from "./relationship";

export const userTags = [
	"admin",
	"moderator",
	"beta_tester",
	"debugger",
	"verified",
	"legacy_vrlfp"
] as const;

export const userTagNames: Record<UserTags, string> = {
	admin: "Admin",
	moderator: "Moderator",
	beta_tester: "Beta Tester",
	debugger: "Debugger",
	verified: "Verified",
	legacy_vrlfp: "Legacy VRLFP"
};

export type UserTags = (typeof userTags)[number];

export type UserPasskey = UuidModel &
	DatedModel & {
		aaguid: string;
	};

export type User = UuidModel &
	Partial<DatedModel> & {
		email: string;
		slug: string;
		language?: string;
		talkjsId: string;
		talkjsSignature?: string;
		apnsToken?: string;
		fcmToken?: string;
		pushCount?: number;
		ratingPrompts?: number;
		chargebeeId?: string;
		stripeId?: string;
		revenuecatId?: string;
		moderatorMessage?: string;
		moderatorNote?: string;
		status: string;
		relationship?: Relationship;
		bornAt?: string;
		activeAt?: string;
		emailConfirmedAt?: string;
		shadowbannedAt?: string;
		indefShadowbannedAt?: string;
		paymentsBannedAt?: string;
		bannedAt?: string;
		deactivatedAt?: string;
		preferences?: Preferences;
		profile: Profile;
		subscription?: Subscription;
		tags?: Array<UserTags>;
		connections?: Array<Connection>;
		passkeys?: Array<UserPasskey>;
	};

export function displayName(user: User) {
	return user.profile.displayName || user.slug;
}

export async function create(
	options: NarrowFetchOptions<{
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

export async function count(options: NarrowFetchOptions = {}) {
	const { count } = await fetch<{ count: number }>(
		"get",
		"users/count",
		options
	);

	return count;
}

export interface UserPreview {
	id: string;
	name: string;
	age: number;
	dark: boolean;
	attributes: Array<Attribute>;
	avatarUrl: string;
}

export async function preview(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<UserPreview>("get", `users/${userId}/preview`, options);
}

export async function bulk(options: NarrowFetchOptions<Array<string>>) {
	return fetch<Array<User>>("post", "users/bulk", options);
}

export async function search(
	query: PaginateOptions<{ search?: string }> = {},
	requestOptions: FetchOptions = {}
) {
	return fetch<Paginate<User>>("get", "users", {
		...requestOptions,
		query
	});
}

export async function getBySlug(
	slug: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("get", `users/${slug}/name`, options);
}

export type UpdateUserBody = Partial<
	Pick<User, "bornAt" | "language" | "slug">
>;

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

export async function indefShadowban(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("post", `users/${userId}/indef-shadowban`, options);
}

export async function unindefShadowban(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("delete", `users/${userId}/indef-shadowban`, options);
}

export async function paymentsBan(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("post", `users/${userId}/payments-ban`, options);
}

export async function paymentsUnban(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("delete", `users/${userId}/payments-ban`, options);
}

export async function warn(
	userId: string,
	options: NarrowFetchOptions<{
		message: string;
		shadowban: boolean;
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

export async function updatePushTokens(
	userId: string,
	options: NarrowFetchOptions<{
		apnsToken?: string;
		fcmToken?: string;
	}>
) {
	return fetch<User>("post", `users/${userId}/push-tokens`, options);
}

export async function resetPushCount(
	userId: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<User>("delete", `users/${userId}/push-count`, options);
}

export async function updateRatingPrompts(
	userId: string,
	options: NarrowFetchOptions<{
		ratingPrompts: number;
	}>
) {
	return fetch<User>("post", `users/${userId}/rating-prompts`, options);
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

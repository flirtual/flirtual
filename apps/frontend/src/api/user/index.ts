import { toSnakeCase } from "remeda";
import type { WretchOptions } from "wretch";

import type { Locale } from "~/i18n";
import { isUid } from "~/utilities";

import type { Attribute } from "../attributes";
import { api } from "../common";
import type { DatedModel, Paginate, PaginateOptions, UuidModel } from "../common";
import type { Connection } from "../connections";
import type { Subscription } from "../subscription";
import { Preferences } from "./preferences";
import type { Profile } from "./profile";
import type { Relationship } from "./relationship";

export const userTags = [
	"admin",
	"moderator",
	"beta_tester",
	"debugger",
	"verified",
	"legacy_vrlfp",
	"translating",
	"official"
] as const;

export const userTagNames: Record<UserTags, string> = {
	admin: "Admin",
	moderator: "Moderator",
	beta_tester: "Beta Tester",
	debugger: "Debugger",
	verified: "Verified",
	legacy_vrlfp: "Legacy VRLFP",
	translating: "Translating",
	official: "Official"
};

export type UserTags = (typeof userTags)[number];

export type UserPasskey = {
	aaguid: string;
}
& DatedModel & UuidModel;

export const UserStatuses = [
	"registered",
	"finished_profile",
	"onboarded",
	"visible"
] as const;

export type UserStatus = (typeof UserStatuses)[number];

export type User = {
	email: string;
	slug: string;
	talkjsId: string;
	talkjsSignature?: string;
	apnsTokens?: Array<string>;
	fcmTokens?: Array<string>;
	platforms?: Array<string>;
	pushCount?: number;
	ratingPrompts?: number;
	chargebeeId?: string;
	stripeId?: string;
	revenuecatId?: string;
	moderatorMessage?: string;
	moderatorNote?: string;
	status: UserStatus;
	// relationship?: Relationship;
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
	tnsDiscordInBiography?: string;
	connections?: Array<Connection>;
	passkeys?: Array<UserPasskey>;
}
& Partial<DatedModel> & UuidModel;

export interface UserPreview {
	id: string;
	name: string;
	age: number;
	dark: boolean;
	attributes: Array<Attribute>;
	avatarUrl: string;
}

export const searchSortKeys = [
	"similarity",
	"created_at",
	"active_at",
	"born_at",
	"email_confirmed_at",
	"shadowbanned_at",
	"indef_shadowbanned_at",
	"payments_banned_at",
	"banned_at",
	"deactivated_at"
] as const;

export type SearchSortKeys = (typeof searchSortKeys)[number];

export interface SearchOptions {
	search?: string;
	status?: UserStatus;
	tags?: Array<UserTags>;
	sort?: SearchSortKeys;
	order?: "asc" | "desc";
}

export type UpdateUserOptions = Partial<
	Pick<User, "bornAt" | "slug" | "tnsDiscordInBiography">
>;

export interface UpdateUserEmailOptions {
	currentPassword: string;
	email: string;
	emailConfirmation: string;
}

export interface UpdateUserPasswordOptions {
	currentPassword: string;
	password: string;
	passwordConfirmation: string;
}

export const User = {
	Preferences,
	api: api.url("users"),
	create(options: {
		email: string;
		password: string;
		notifications: boolean;
		serviceAgreement: boolean;
		captcha: string;
		language: Locale;
	}) {
		return this.api.json(options).post().json<User>();
	},
	getMany(userIds: Array<string>) {
		return Promise.all(userIds.map((userId) => this.get(userId)));
		// return this.api.url("/bulk").json(userIds).get().json<Array<User>>();
	},
	get(userId: string | null, options: WretchOptions = {}) {
		if (!userId || !isUid(userId)) return Promise.resolve(null);

		return this.api
			.url(`/${userId}`)
			.options(options)
			.get()
			.badRequest(() => null)
			.notFound(() => null)
			.json<User | null>();
	},
	getRelationship(userId: string | null, options: WretchOptions = {}) {
		if (!userId || !isUid(userId)) return Promise.resolve(null);

		return this.api
			.url(`/${userId}/relationship`)
			.options(options)
			.get()
			.badRequest(() => null)
			.notFound(() => null)
			.json<Relationship | null>();
	},
	getBySlug(slug: string, options: WretchOptions = {}) {
		return this.api
			.url(`/${slug.slice(0, 20)}/name`)
			.options(options)
			.get()
			.badRequest(() => null)
			.notFound(() => null)
			.json<User | null>();
	},
	getCount() {
		return this.api
			.url("/count")
			.options({ credentials: "omit" })
			.get()
			.fetchError(() => ({ count: 0 }))
			.json<{ count: number }>();
	},
	async getApproximateCount() {
		const { count } = await this.getCount();
		return Math.floor(count / 50000) * 50000;
	},
	preview(userId: string) {
		return this.api.url(`/${userId}/preview`).get().json<UserPreview>();
	},
	search(options: PaginateOptions<SearchOptions>) {
		return this.api.query(options).get().json<Paginate<string>>();
	},
	update(
		userId: string,
		{
			required,
			...options
		}: { required?: Array<keyof UpdateUserOptions> } & UpdateUserOptions
	) {
		return this.api
			.url(`/${userId}`)
			.json(options)
			.query({
				required: Array.isArray(required)
					? required.map((key) => toSnakeCase(key))
					: undefined
			})
			.post()
			.json<User>();
	},
	updateEmail(userId: string, options: UpdateUserEmailOptions) {
		return this.api.url(`/${userId}/email`).json(options).post().json<User>();
	},
	updatePassword(userId: string, options: UpdateUserPasswordOptions) {
		return this.api
			.url(`/${userId}/password`)
			.json(options)
			.post()
			.json<User>();
	},
	confirmEmail(token: string) {
		return api.url("auth/email/confirm").json({ token }).post().json<unknown>();
	},
	resendConfirmEmail() {
		return api.url("auth/email/confirm").delete().json<unknown>();
	},
	deactivate(userId: string) {
		return this.api.url(`/${userId}/deactivate`).post().json<User>();
	},
	reactivate(userId: string) {
		return this.api.url(`/${userId}/deactivate`).delete().json<User>();
	},
	block(userId: string) {
		return this.api.url(`/${userId}/block`).post().json<unknown>();
	},
	unblock(userId: string) {
		return this.api.url(`/${userId}/block`).delete().json<unknown>();
	},
	suspend(
		userId: string,
		options: {
			reasonId?: string;
			message?: string;
		}
	) {
		return this.api.url(`/${userId}/suspend`).json(options).post().json<User>();
	},
	unsuspend(userId: string) {
		return this.api.url(`/${userId}/suspend`).delete().json<User>();
	},
	indefShadowban(userId: string) {
		return this.api.url(`/${userId}/indef-shadowban`).post().json<User>();
	},
	unindefShadowban(userId: string) {
		return this.api.url(`/${userId}/indef-shadowban`).delete().json<User>();
	},
	paymentsBan(userId: string) {
		return this.api.url(`/${userId}/payments-ban`).post().json<User>();
	},
	paymentsUnban(userId: string) {
		return this.api.url(`/${userId}/payments-ban`).delete().json<User>();
	},
	warn(
		userId: string,
		options: {
			reasonId: string;
			message: string;
			shadowban: boolean;
		}
	) {
		return this.api.url(`/${userId}/warn`).json(options).post().json<User>();
	},
	deleteWarn(userId: string) {
		return this.api.url(`/${userId}/warn`).delete().json<User>();
	},
	acknowledgeWarn(userId: string) {
		return this.api.url(`/${userId}/warn`).put().json<User>();
	},
	note(userId: string, options: { message: string }) {
		return this.api.url(`/${userId}/note`).json(options).post().json<User>();
	},
	deleteNote(userId: string) {
		return this.api.url(`/${userId}/note`).delete().json<User>();
	},
	addPushToken(
		userId: string,
		options: { type: "apns" | "fcm"; token?: string }
	) {
		return this.api
			.url(`/${userId}/push-token`)
			.json(options)
			.post()
			.json<User>();
	},
	resetPushCount(userId: string) {
		return this.api.url(`/${userId}/push-count`).delete().json<User>();
	},
	updateRatingPrompts(userId: string, options: { ratingPrompts: number }) {
		return this.api
			.url(`/${userId}/rating-prompts`)
			.json(options)
			.post()
			.json<User>();
	},
	deleteSelf(options: {
		reasonId: string;
		comment: string;
		currentPassword: string;
		captcha: string;
	}) {
		return this.api.json(options).delete().json<User>();
	},
	delete(userId: string) {
		return this.api.url(`/${userId}`).delete().json<User>();
	}
};

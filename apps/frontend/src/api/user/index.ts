import { toSnakeCase } from "remeda";
import type { WretchOptions } from "wretch";

import { development } from "~/const";
import type { Locale } from "~/i18n";
import { isUid } from "~/utilities";

import type { Attribute } from "../attributes";
import { api } from "../common";
import type { DatedModel, Paginate, PaginateOptions, UuidModel } from "../common";
import type { Connection } from "../connections";
import type { Entitlement } from "../subscription";
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
	"official",
	"dob_locked",
	"reminder_670",
	"reminder_700",
	"reminder_723"
] as const;

export const userTagNames: Record<UserTags, string> = {
	admin: "Admin",
	moderator: "Moderator",
	beta_tester: "Beta Tester",
	debugger: "Debugger",
	verified: "Verified",
	legacy_vrlfp: "Legacy VRLFP",
	translating: "Translating",
	official: "Official",
	dob_locked: "DOB Locked",
	reminder_670: "Reminder 670",
	reminder_700: "Reminder 700",
	reminder_723: "Reminder 723"
};

export type UserTags = (typeof userTags)[number];

export const searchTags = [
	"premium_subscription",
	"lifetime_premium",
	"promotional_premium",
	...userTags
] as const;

export type SearchTag = (typeof searchTags)[number];

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
	talkjsToken?: string;
	hasPassword?: boolean;
	apnsTokens?: Array<string>;
	fcmTokens?: Array<string>;
	platforms?: Array<string>;
	pushCount?: number;
	ratingPrompts?: number;
	news?: Array<string>;
	chargebeeId?: string;
	stripeId?: string;
	revenuecatId?: string;
	moderatorMessage?: string;
	moderatorNote?: string;
	status: UserStatus;
	// relationship?: Relationship;
	age?: number;
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
	entitlements?: Array<Entitlement>;
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
	tags?: Array<SearchTag>;
	sort?: SearchSortKeys;
	order?: "asc" | "desc";
}

export type UpdateUserOptions = Partial<
	Pick<User, "bornAt" | "slug" | "tnsDiscordInBiography">
>;

export interface UpdateUserEmailOptions {
	currentPassword?: string;
	email: string;
	emailConfirmation: string;
}

export interface UpdateUserPasswordOptions {
	currentPassword?: string;
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
	getCount(options: WretchOptions = {}) {
		return this.api
			.url("/count")
			.options({ credentials: development ? "include" : "omit", ...options })
			.get()
			.fetchError(() => ({ count: 0 }))
			.json<{ count: number }>();
	},
	async getApproximateCount(options: WretchOptions = {}) {
		const { count } = await this.getCount(options);
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
	grantPromotionalPremium(userId: string) {
		return this.api.url(`/${userId}/promotional-premium`).post().json<User>();
	},
	revokePromotionalPremium(userId: string) {
		return this.api.url(`/${userId}/promotional-premium`).delete().json<User>();
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
	addTag(userId: string, tag: string) {
		return this.api.url(`/${userId}/tags`).json({ tag }).post().json<User>();
	},
	removeTag(userId: string, tag: string) {
		return this.api.url(`/${userId}/tags`).json({ tag }).delete().json<User>();
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
	removeNews(userId: string, news: Array<string>) {
		return this.api.url(`/${userId}/news`).json({ news }).delete().json<User>();
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

export function activeEntitlements(user: User) {
	return user.entitlements?.filter((entitlement) => entitlement.active) ?? [];
}

export function premium(user: User) {
	return activeEntitlements(user).some(
		(entitlement) => entitlement.plan.product === "premium"
	);
}

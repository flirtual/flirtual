import type { Expand } from "~/utilities";

import { api } from "./common";
import type { CreatedAtModel, UuidModel } from "./common";
import type { ProfileImage } from "./user/profile/images";

export const moderationEventTypes = [
	"banned",
	"unbanned",
	"indef_shadowbanned",
	"unindef_shadowbanned",
	"warned",
	"warn_revoked",
	"warn_acknowledged",
	"payments_banned",
	"payments_unbanned",
	"image_removed",
	"image_quarantined",
	"flagged_keyword",
	"flagged_bio",
	"flagged_domain",
	"flagged_duplicate",
	"flagged_image",
	"flagged_duplicate_image",
	"flagged_registered_underage",
	"flagged_honeypot",
	"appealed",
	"deleted",
	"exit_survey"
] as const;

export type ModerationEventType = (typeof moderationEventTypes)[number];

export const adminModerationEventTypes: ReadonlyArray<ModerationEventType> = [
	"deleted",
	"payments_banned",
	"payments_unbanned",
	"appealed",
	"exit_survey"
];

export const reviewableModerationEventTypes: ReadonlyArray<ModerationEventType> = [
	"flagged_keyword",
	"flagged_bio",
	"flagged_domain",
	"flagged_duplicate",
	"flagged_image",
	"flagged_duplicate_image",
	"flagged_registered_underage",
	"flagged_honeypot",
	"warn_acknowledged"
];

export type ModerationEvent = Expand<
	{
		type: ModerationEventType;
		userId?: string;
		moderatorId?: string;
		reasonId?: string;
		message?: string;
		automatic: boolean;
		details: Record<string, unknown>;
		reviewedAt?: string;
		reviewedBy?: string;
		revokedAt?: string;
		revokedBy?: string;
		acknowledgedAt?: string;
		related?: {
			duplicateBans?: Array<ModerationEvent>;
			ban?: ModerationEvent;
			images?: Array<{ image: ProfileImage; userId?: string }>;
			quarantineUrl?: string;
		};
	}
	& CreatedAtModel & UuidModel
>;

export interface SearchModerationEventOptions {
	types: Array<ModerationEventType>;
	eventId?: string;
	search?: string;
	reasonIds?: Array<string>;
	excludedDuplicateTypes?: Array<string>;
	reviewed?: boolean;
	order?: "asc" | "desc";
	limit?: number;
	cursor?: string;
}

export const ModerationEvent = {
	api: api.url("moderation-events"),
	search({ types, reasonIds, excludedDuplicateTypes, ...options }: SearchModerationEventOptions) {
		return this.api
			.query(
				{
					...options,
					types: types.join(","),
					reasonIds: reasonIds?.join(","),
					excludedDuplicateTypes: excludedDuplicateTypes?.join(",")
				},
				{ omitUndefinedOrNullValues: true }
			)
			.get()
			.json<Array<ModerationEvent>>();
	},
	review(eventId: string) {
		return this.api.url(`/${eventId}/review`).post().json<ModerationEvent>();
	},
	list(userId: string) {
		return api.url(`users/${userId}/moderation-events`).get().json<Array<ModerationEvent>>();
	}
};

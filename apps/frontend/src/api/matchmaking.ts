import type { WretchOptions } from "wretch";

import {
	api

} from "./common";
import type { CursorPaginate, Issue } from "./common";

export const ProspectKind = ["love", "friend"] as const;
export const prospectKinds = ProspectKind;
export type ProspectKind = (typeof ProspectKind)[number];

export const LikesYouGenderFilter = ["man", "woman", "other"] as const;
export type LikesYouGenderFilter = (typeof LikesYouGenderFilter)[number];

export interface LikesYouFilters {
	kind?: ProspectKind;
	gender?: LikesYouGenderFilter;
}

export type ProspectRespondType = "like" | "pass";

export interface LikeAndPassItem {
	profileId: string;
	targetId: string;
	type: ProspectRespondType;
	kind: ProspectKind;
};

export interface RespondProspectBody {
	type: ProspectRespondType;
	mode: ProspectKind;
	userId: string;
}

export interface RespondProspect {
	match: boolean;
	matchKind: ProspectKind | null;
	userId: string;
	queue: Queue;
}

export type QueueActionIssue
	= | Issue<"already_responded" | "already_undone" | "blocked" | "nothing_to_undo">
		| Issue<"out_of_browses" | "out_of_likes", { reset_at: string }>
		| QueueIssue;

export interface ReverseRespondProspectBody {
	mode: ProspectKind;
}

export interface QueueLimits {
	likes: { used: number; max: number };
	browses: { used: number; max: number };
	resetAt: string | null;
}

export interface Queue {
	previous: string | null;
	next: Array<string>;
	fallback: boolean;
	notice: "fallback" | null;
	limits: QueueLimits | null;
	canUndo: boolean;
	pending: boolean;
};

export type QueueIssue = Issue<"confirm_email" | "finish_profile">;
export type QueueResponse = Queue | QueueIssue;

export const Matchmaking = {
	queue(mode: ProspectKind, options: WretchOptions = {}) {
		return api
			.url("queue")
			.query({ mode })
			.options(options)
			.get()
			.json<Queue>();
	},
	queueAction(body: RespondProspectBody) {
		return api.url("queue").json(body).post().json<RespondProspect>();
	},
	like(mode: ProspectKind, userId: string) {
		return this.queueAction({ type: "like", mode, userId });
	},
	pass(mode: ProspectKind, userId: string) {
		return this.queueAction({ type: "pass", mode, userId });
	},
	undo(body: ReverseRespondProspectBody) {
		return api.url("queue").json(body).delete().json<RespondProspect>();
	},
	skipProspect(userId: string) {
		return api.url("queue/prospect").query({ userId }).delete().json<{ success: true }>();
	},
	dismissNotice(mode: ProspectKind) {
		return api.url("queue/notice").query({ mode }).delete().json<{ success: true }>();
	},
	unmatch(userId: string) {
		return api.url("matches").query({ userId }).delete().res();
	},
	resetProspect() {
		return api.url("prospects").delete().res();
	},
	resetLikes() {
		return api.url("likes").delete().res();
	},
	resetPasses() {
		return api.url("passes").delete().res();
	},
	likesYou(cursor?: string, filters?: LikesYouFilters, options: WretchOptions = {}) {
		return api
			.url("likes")
			.query({ ...filters, ...(cursor ? { cursor } : {}) })
			.options(options)
			.get()
			.json<LikesYouList>();
	},
	likesYouPreview(options: WretchOptions = {}) {
		return api
			.url("likes/preview")
			.options(options)
			.get()
			.json<LikesYouPreview>();
	}
};

export type LikesYouList = CursorPaginate<LikeAndPassItem>;

export interface LikesYouPreview {
	count: {
		[K in ProspectKind]?: number;
	};
	thumbnails: Array<string>;
}

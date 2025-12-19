import type { WretchOptions } from "wretch";

import {
	api

} from "./common";
import type { CursorPaginate, Issue } from "./common";

export const ProspectKind = ["love", "friend"] as const;
export const prospectKinds = ProspectKind;
export type ProspectKind = (typeof ProspectKind)[number];

export type ProspectRespondType = "like" | "pass";

export interface LikeAndPassItem {
	profileId: string;
	targetId: string;
	type: ProspectRespondType;
	kind: ProspectKind;
};

export interface RespondProspectBody {
	type: ProspectRespondType;
	kind: ProspectKind;
	mode?: ProspectKind;
	userId?: string;
}

export interface RespondProspect {
	match: boolean;
	matchKind: ProspectKind;
	userId: string;
	queue: Queue;
}

export type QueueActionIssue
	= | Issue<"already_responded">
		| Issue<"out_of_likes" | "out_of_passes", { reset_at: string }>
		| QueueIssue;

export interface ReverseRespondProspectBody {
	mode: ProspectKind;
}

export interface Queue {
	previous: string | null;
	next: Array<string>;
};

export type QueueIssue = Issue<"confirm_email" | "finish_profile">;
export type QueueResponse = Queue | QueueIssue;

export const Matchmaking = {
	queue(kind: ProspectKind, options: WretchOptions = {}) {
		return api
			.url("queue")
			.query({ kind })
			.options(options)
			.get()
			// .forbidden((reason) => {
			// 	if (isWretchError(reason)) return reason.json;
			// })
			.json<Queue>();
	},
	queueAction(body: RespondProspectBody) {
		return api.url("queue").json(body).post().json<RespondProspect>();
	},
	like(kind: ProspectKind = "love") {
		return this.queueAction({ type: "like", kind });
	},
	pass(kind: ProspectKind = "love") {
		return this.queueAction({ type: "pass", kind });
	},
	undo(body: ReverseRespondProspectBody) {
		return api.url("queue").json(body).delete().json<RespondProspect>();
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
	likesYou(cursor?: string) {
		return api
			.url("likes")
			.query(cursor ? { cursor } : {})
			.get()
			.json<LikesYouList>();
	},
	likesYouPreview() {
		return api
			.url("likes/preview")
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

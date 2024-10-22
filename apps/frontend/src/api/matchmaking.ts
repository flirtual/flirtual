import {
	api,
	type Issue,
	isWretchError,
	type CreatedAtModel,
	type UuidModel
} from "./common";

export const ProspectKind = ["love", "friend"] as const;
export type ProspectKind = (typeof ProspectKind)[number];

export type ProspectRespondType = "like" | "pass";

export type LikeAndPassItem = UuidModel &
	CreatedAtModel & {
		profileId: string;
		targetId: string;
		type: ProspectRespondType;
		kind: ProspectKind;
		match?: boolean;
		opposite?: LikeAndPassItem;
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

export type QueueActionIssue =
	| Issue<"out_of_likes" | "out_of_passes", { reset_at: string }>
	| Issue<"already_responded">
	| QueueIssue;

export interface ReverseRespondProspectBody {
	mode: ProspectKind;
}

export type Queue = [
	previous: string | null,
	current: string | null,
	next: string | null
];

export type QueueIssue = Issue<"finish_profile" | "confirm_email">;
export type QueueResponse = Queue | QueueIssue;

export const Matchmaking = {
	queue(kind: ProspectKind) {
		return api
			.url("queue")
			.query({ kind })
			.get()
			.forbidden((reason) => {
				if (isWretchError(reason)) return reason.json;
			})
			.json<QueueResponse>();
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
	listMatches(unrequited?: boolean) {
		return api.url("matches").query({ unrequited }).get().json<{
			count: {
				[K in ProspectKind]?: number;
			};
			items: Array<LikeAndPassItem>;
			thumbnails?: Array<string>;
		}>();
	}
};

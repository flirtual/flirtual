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
	userId: string;
}

export interface RespondProspect {
	match: boolean;
	matchKind: ProspectKind;
	userId: string;
	queue: Queue;
}

export type RespondProspectResponse =
	| RespondProspect
	| Issue<"out_of_likes" | "out_of_passes", { resetAt: string }>
	| Issue<"already_responded">
	| QueueIssues;

export interface ReverseRespondProspectBody {
	mode: ProspectKind;
}

export type Queue = [
	previous: string | null,
	current: string | null,
	next: string | null
];

export type QueueIssues = Issue<"finish_profile" | "confirm_email">;
export type QueueResponse = Queue | QueueIssues;

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
		return api
			.url("queue")
			.json(body)
			.post()
			.error(429, (reason) => {
				if (isWretchError(reason)) return reason.json;
			})
			.error(409, (reason) => {
				if (isWretchError(reason)) return reason.json;
			})
			.json<RespondProspectResponse>();
	},
	like(userId: string, kind: ProspectKind) {
		return this.queueAction({ type: "like", kind, userId });
	},
	pass(userId: string, kind: ProspectKind) {
		return this.queueAction({ type: "pass", kind, userId });
	},
	undo(body: ReverseRespondProspectBody) {
		return api
			.url("queue")
			.json(body)
			.delete()
			.error(429, (reason) => {
				if (isWretchError(reason)) return reason.json;
			})
			.json<RespondProspectResponse>();
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

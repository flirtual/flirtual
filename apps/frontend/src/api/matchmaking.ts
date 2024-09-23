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

export interface RespondProspectResponse {
	success: boolean;
	message?: string;
	resetAt?: string;
}

export interface ReverseRespondProspectBody {
	kind: ProspectKind;
	userId: string;
}

export const Matchmaking = {
	queue(kind: ProspectKind) {
		return api
			.url("queue")
			.query({ kind })
			.get()
			.forbidden((reason) => {
				if (isWretchError(reason)) return reason.json;
			})
			.json<
				| {
						prospects: Array<string>;
						passes: number;
						likes: number;
						likesLeft: number;
						passesLeft: number;
				  }
				| Issue<"finish_profile">
				| Issue<"confirm_email">
			>();
	},
	respondProspect(body: RespondProspectBody) {
		return api
			.url("prospects/respond")
			.json(body)
			.post()
			.json<RespondProspectResponse>();
	},
	reverseRespondProspect(body: ReverseRespondProspectBody) {
		return api
			.url("prospects/respond")
			.json(body)
			.delete()
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

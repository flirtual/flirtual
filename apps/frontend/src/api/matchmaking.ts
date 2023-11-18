import { CreatedAtModel, UuidModel } from "./common";
import { fetch, NarrowFetchOptions } from "./exports";
import { User } from "./user";

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

export async function queue(
	options: NarrowFetchOptions<undefined, { kind: ProspectKind }>
) {
	return fetch<{
		prospects: Array<User>;
		passes: number;
		likes: number;
		likesLeft: number;
		passesLeft: number;
	}>("get", "queue", options);
}

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

export async function respondProspect(
	options: NarrowFetchOptions<RespondProspectBody>
): Promise<RespondProspectResponse> {
	return fetch("post", `prospects/respond`, options);
}

export interface ReverseRespondProspectBody {
	kind: ProspectKind;
	userId: string;
}

export async function reverseRespondProspect(
	options: NarrowFetchOptions<ReverseRespondProspectBody>
) {
	return fetch("delete", `prospects/respond`, options);
}

export async function unmatch(
	options: NarrowFetchOptions<undefined, { userId: string }>
) {
	return fetch("delete", `matches`, options);
}

export async function resetProspect(options: NarrowFetchOptions = {}) {
	return fetch("delete", `prospects`, options);
}

export async function resetLikes(options: NarrowFetchOptions = {}) {
	return fetch("delete", `likes`, options);
}

export async function resetPasses(options: NarrowFetchOptions = {}) {
	return fetch("delete", `passes`, options);
}

export async function listMatches(
	options: NarrowFetchOptions<undefined, { unrequited?: boolean }>
) {
	return fetch<{
		count: {
			[K in ProspectKind]?: number;
		};
		items: Array<LikeAndPassItem>;
	}>("get", `matches`, options);
}

import { CreatedAtModel, UuidModel } from "./common";
import { fetch, NarrowFetchOptions } from "./exports";

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

export async function listProspects(
	options: NarrowFetchOptions<undefined, { kind: ProspectKind }>
): Promise<Array<string>> {
	return fetch<Array<string>>("get", "prospects", options);
}

export interface RespondProspectBody {
	type: ProspectRespondType;
	kind: ProspectKind;
	mode?: ProspectKind;
	userId: string;
}

export async function respondProspect(options: NarrowFetchOptions<RespondProspectBody>) {
	return fetch("post", `prospects/respond`, options);
}

export async function reverseRespondProspect(options: NarrowFetchOptions<RespondProspectBody>) {
	return fetch("delete", `prospects/respond`, options);
}

export async function resetProspect(options: NarrowFetchOptions = {}) {
	return fetch("delete", `prospects`, options);
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

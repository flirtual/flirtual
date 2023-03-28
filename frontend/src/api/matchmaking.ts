import { fetch, NarrowFetchOptions } from "./exports";

export const ProspectKind = ["love", "friend"] as const;
export type ProspectKind = (typeof ProspectKind)[number];

export async function listProspects(
	options: NarrowFetchOptions<undefined, { kind: ProspectKind }>
): Promise<Array<string>> {
	return fetch<Array<string>>("get", "prospects", options);
}

export type ProspectRespondType = "like" | "pass";

export interface RespondProspectBody {
	type: ProspectRespondType;
	kind: ProspectKind;
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

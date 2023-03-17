import { fetch, NarrowFetchOptions } from ".";

export async function listProspects(options: NarrowFetchOptions = {}): Promise<Array<string>> {
	return fetch<Array<string>>("get", "prospects", options);
}

export type ProspectRespondType = "like" | "pass";

export type RespondProspectBody = {
	type: ProspectRespondType;
	userId: string;
}

export async function respondProspect(
	options: NarrowFetchOptions<RespondProspectBody>
) {
	return fetch("post", `prospects/respond`, options);
}

export async function reverseRespondProspect(
	options: NarrowFetchOptions<RespondProspectBody>
) {
	return fetch("delete", `prospects/respond`, options);
}

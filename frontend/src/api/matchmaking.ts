import { fetch, NarrowFetchOptions } from ".";

export async function listProspects(options: NarrowFetchOptions = {}): Promise<Array<string>> {
	return fetch<Array<string>>("get", "prospects", options);
}

export type ProspectRespondType = "like" | "pass";

export async function respondProspect(
	options: NarrowFetchOptions<{
		type: ProspectRespondType;
		userId: string;
	}>
) {
	return fetch("post", `prospects/respond`, options);
}

import { Expand } from "~/utilities";

import { DatedModel, UuidModel } from "./common";

import { fetch, NarrowFetchOptions } from ".";

export type Report = Expand<
	UuidModel &
		DatedModel & {
			reasonId: string;
			message: string;
			userId: string;
			targetId: string;
		}
>;

export async function list(
	options: NarrowFetchOptions<undefined, Partial<Pick<Report, "reasonId" | "userId" | "targetId">>>
): Promise<Array<Report>> {
	return fetch<Array<Report>>("get", "reports", options);
}

export async function create(
	options: NarrowFetchOptions<Pick<Report, "reasonId" | "targetId">>
): Promise<Report> {
	return fetch<Report>("post", "reports", options);
}

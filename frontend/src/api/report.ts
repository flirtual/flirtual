import { Expand } from "~/utilities";
import { Attribute } from "./attributes";

import { DatedModel, UuidModel } from "./common";
import { fetch, NarrowFetchOptions } from "./exports";

export type Report = Expand<
	UuidModel &
		DatedModel & {
			reason: Attribute<"report-reason">;
			message: string;
			userId: string;
			targetId: string;
		}
>;

export async function list(
	options: NarrowFetchOptions<undefined, Partial<Pick<Report, "userId" | "targetId">>>
): Promise<Array<Report>> {
	return fetch<Array<Report>>("get", "reports", options);
}

export async function create(
	options: NarrowFetchOptions<Pick<Report, "targetId"> & { reportId: string }>
): Promise<Report> {
	return fetch<Report>("post", "reports", options);
}

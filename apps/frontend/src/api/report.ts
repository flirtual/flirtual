import { Expand } from "~/utilities";

import { Attribute } from "./attributes";
import { DatedModel, UuidModel } from "./common";
import { fetch, NarrowFetchOptions } from "./exports";

export type Report = Expand<
	UuidModel &
	DatedModel & {
		reason: Pick<Attribute<"report-reason">, "id" | "name">;
		message?: string;
		images?: Array<string>;
		reviewedAt?: string;
		userId?: string;
		targetId: string;
	}
>;

export type ListOptions = NarrowFetchOptions<
	undefined,
	Partial<
		Pick<Report, "userId" | "targetId"> & {
			reviewed: boolean;
			indefShadowbanned: boolean;
		}
	>
>;

export async function list(options: ListOptions): Promise<Array<Report>> {
	return fetch<Array<Report>>("get", "reports", options);
}

export async function create(
	options: NarrowFetchOptions<
		Pick<Report, "targetId"> & {
			reasonId: string;
			message?: string;
			images?: Array<string>;
		}
	>
): Promise<Report> {
	return fetch<Report>("post", "reports", options);
}

export async function clear(
	reportId: string,
	options: NarrowFetchOptions = {}
): Promise<Report> {
	return fetch<Report>("delete", `reports/${reportId}`, options);
}

export async function clearAll(
	options: NarrowFetchOptions<undefined, { targetId: string }>
) {
	return fetch<{ count: number }>("delete", `reports`, options);
}

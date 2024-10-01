import { api, type DatedModel, type UuidModel } from "./common";

import type { Expand } from "~/utilities";

export type Report = Expand<
	UuidModel &
		DatedModel & {
			reasonId: string;
			message?: string;
			images?: Array<string>;
			reviewedAt?: string;
			userId?: string;
			targetId: string;
		}
>;

export type ListReportOptions = Partial<
	Pick<Report, "userId" | "targetId"> & {
		reviewed: boolean;
		indefShadowbanned: boolean;
	}
>;

export type CreateReportOptions = Pick<Report, "targetId"> & {
	reasonId: string;
	message?: string;
	images?: Array<string>;
};

export const Report = {
	api: api.url("reports"),
	create(options: CreateReportOptions) {
		return this.api.json(options).post().json<Report>();
	},
	list(options: ListReportOptions) {
		return this.api.query(options).get().json<Array<Report>>();
	},
	get(reportId: string) {
		return this.api.url(`/${reportId}`).get().json<Report>();
	},
	clear(reportId: string) {
		return this.api.url(`/${reportId}`).delete().json<Report>();
	},
	clearAll(targetId: string) {
		return this.api.query({ targetId }).delete().json<{ count: number }>();
	}
};

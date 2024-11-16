import type { Expand } from "~/utilities";

import { api, type DatedModel, type UuidModel } from "./common";

export type Report = Expand<
	{
		reasonId: string;
		message?: string;
		images?: Array<string>;
		reviewedAt?: string;
		userId?: string;
		targetId: string;
	} &
	DatedModel & UuidModel
>;

export type ListReportOptions = Partial<
	{
		reviewed: boolean;
		indefShadowbanned: boolean;
	} & Pick<Report, "targetId" | "userId">
>;

export type CreateReportOptions = {
	reasonId: string;
	message?: string;
	images?: Array<string>;
} & Pick<Report, "targetId">;

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

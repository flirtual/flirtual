import type { Expand } from "~/utilities";

import { api } from "./common";
import type { Paginate, PaginateOptions, UpdatedAtModel, UuidModel } from "./common";

export type FlagType = "email" | "text" | "username";

export type Flag = Expand<
	{
		type: FlagType;
		flag: string;
	}
	& UpdatedAtModel & UuidModel
>;

export type ListFlagOptions = PaginateOptions<{
	type?: FlagType;
	search?: string;
	sort?: "flag" | "updated_at";
	order?: "asc" | "desc";
}>;

export interface CreateFlagOptions {
	type: FlagType;
	flag: string;
}

export const Flag = {
	api: api.url("flags"),
	list(options: ListFlagOptions = {}) {
		return this.api.query(options).get().json<Paginate<Flag>>();
	},
	create(options: CreateFlagOptions) {
		return this.api.json(options).post().json<Flag>();
	},
	delete(flagId: string) {
		return this.api.url(`/${flagId}`).delete().json<{ deleted: boolean }>();
	}
};

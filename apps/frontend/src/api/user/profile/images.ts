import { DatedModel, UuidModel } from "~/api/common";
import { urls } from "~/urls";

import { fetch, NarrowFetchOptions } from "../../exports";

export type ProfileImage = UuidModel &
	DatedModel & {
		originalFile?: string;
		externalId?: string;
		scanned?: boolean;
	};

export const notFoundImage = {
	id: "not-found",
	url: urls.media("e8212f93-af6f-4a2c-ac11-cb328bbc4aa4"),
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString()
};

export type ProfileImageList = Array<ProfileImage>;

export async function create(
	userId: string,
	options: NarrowFetchOptions<Array<string>>
) {
	return fetch<ProfileImageList>(
		"put",
		`users/${userId}/profile/images`,
		options
	);
}

export async function update(
	userId: string,
	options: NarrowFetchOptions<Array<string>>
) {
	return fetch<ProfileImageList>(
		"post",
		`users/${userId}/profile/images`,
		options
	);
}

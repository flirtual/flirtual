import { DatedModel, UuidModel } from "~/api/common";

import { fetch, NarrowFetchOptions } from "../../exports";
import { upload as uploadFiles } from "../../file";

export type ProfileImage = UuidModel &
	DatedModel & {
		url: string;
		scanned?: boolean;
	};

export type ProfileImageList = Array<ProfileImage>;

export async function upload(
	userId: string,
	{ body, ...options }: NarrowFetchOptions<Array<File>>
) {
	const fileIds = await uploadFiles(body, { store: true });
	return create(userId, { ...options, body: fileIds });
}

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

import { DatedModel, UuidModel } from "~/api/common";

import { fetch, FetchOptions } from "../..";
import { FileUploadOptions, upload as uploadFiles } from "../../file";

export type ProfileImage = UuidModel &
	DatedModel & {
		externalId: string;
		scanned: boolean;
	};

export type ProfileImageList = Array<ProfileImage>;

export async function upload(
	userId: string,
	files: Array<File>,
	options: FetchOptions & { uploadOptions?: FileUploadOptions } = {}
) {
	const fileIds = await uploadFiles(files, options.uploadOptions);
	return create(userId, fileIds);
}

export async function create(userId: string, fileIds: Array<string>, options: FetchOptions = {}) {
	return fetch<ProfileImageList>("put", `users/${userId}/profile/images`, {
		...options,
		body: { fileIds }
	});
}

export async function update(userId: string, imageIds: Array<string>, options: FetchOptions = {}) {
	return fetch<ProfileImageList>("post", `users/${userId}/profile/images`, {
		...options,
		body: { imageIds }
	});
}

import { api } from "~/api/common";
import type { DatedModel, UuidModel } from "~/api/common";

export interface ProfileImageMetadata {
	authorId: string;
	authorName?: string;
	worldId: string;
	worldName?: string;
}

export type ProfileImage = {
	originalFile?: string;
	externalId?: string;
	spatialId?: string;
	blurHash?: string;
}
& DatedModel
& Partial<ProfileImageMetadata> & UuidModel;

export interface WorldProfileItem {
	userId: string;
	images: Array<ProfileImage>;
}

export const ProfileImage = {
	create(userId: string, files: Array<{ id: string; stereo?: boolean } & Partial<ProfileImageMetadata>>) {
		return api
			.url(`users/${userId}/profile/images`)
			.json(files)
			.put()
			.json<Array<ProfileImage>>();
	},
	update(userId: string, imageIds: Array<string>) {
		return api
			.url(`users/${userId}/profile/images`)
			.json(imageIds)
			.post()
			.json<Array<ProfileImage>>();
	},
	get(imageId: string) {
		return api.url(`images/${imageId}`).get().json<ProfileImage>();
	},
	delete(imageId: string) {
		return api.url(`images/${imageId}`).delete().json<ProfileImage>();
	},
	deleteIllegal(imageId: string) {
		return api.url(`images/${imageId}/illegal`).delete().json<unknown>();
	},
	listByWorld(worldId: string) {
		return api
			.url(`worlds/${encodeURIComponent(worldId)}/profiles`)
			.get()
			.json<Array<WorldProfileItem>>();
	},
	searchByImage(file: File) {
		return api
			.url("images/search")
			.headers({ "content-type": file.type || "application/octet-stream" })
			.body(file)
			.post()
			.json<Array<WorldProfileItem>>();
	},
	searchByUrl(url: string) {
		return api.url("images/search").query({ url }).post().json<Array<WorldProfileItem>>();
	},
	searchSimilar(imageId: string) {
		return api.url(`images/${imageId}/similar`).get().json<Array<WorldProfileItem>>();
	}
};

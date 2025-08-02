import Gradient from "virtual:remote/e8212f93-af6f-4a2c-ac11-cb328bbc4aa4";

import { api } from "~/api/common";
import type { DatedModel, UuidModel } from "~/api/common";

export type ProfileImage = {
	originalFile?: string;
	externalId?: string;
	scanned?: boolean;
}
& DatedModel & UuidModel;

export const notFoundImage = {
	id: "not-found",
	url: Gradient,
	createdAt: new Date("2024-05-01T00:00:00.000Z").toISOString(),
	updatedAt: new Date("2024-05-01T00:00:00.000Z").toISOString()
};

export const ProfileImage = {
	create(userId: string, imageIds: Array<string>) {
		return api
			.url(`users/${userId}/profile/images`)
			.json(imageIds)
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
	}
};

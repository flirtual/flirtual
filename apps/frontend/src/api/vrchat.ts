import { api } from "./common";

export interface World {
	id: string;
	name: string;
	description: string;
	tags: Array<string>;
	imageUrl: string;
	thumbnailImageUrl: string;
	authorId: string;
	authorName: string;
}

export const worldCategories = [
	"recommended",
	"spotlight",
	"active",
	"new",
	"games",
	"random"
] as const;
export type WorldCategory = (typeof worldCategories)[number];

export const VRChat = {
	api: api.url("vrchat"),

	getWorldsByCategory(category: WorldCategory, page = 0) {
		return this.api
			.url(`/worlds/${category}`)
			.query({ page })
			.get()
			.json<Array<World>>();
	}
};

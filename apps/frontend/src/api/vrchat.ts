import { api } from "./common";

export interface VRChatWorld {
	id: string;
	name: string;
	imageUrl: string;
	thumbnailImageUrl: string;
	authorName: string;
	tags: string[];
	popularity: number;
	heat: number;
}

export interface VRChatWorldsResponse {
	worlds: VRChatWorld[];
	hasMore: boolean;
}

export interface VRChatCategory {
	title: string;
	worlds: VRChatWorld[];
	hasMore: boolean;
}

export interface VRChatCategoriesResponse {
	categories: {
		spotlight: VRChatCategory;
		active: VRChatCategory;
		new: VRChatCategory;
		games: VRChatCategory;
		random: VRChatCategory;
	};
}

export interface VRChatInstance {
	instanceId: string;
	shortName: string;
	worldId: string;
	type: string;
	region: string;
	canRequestInvite: boolean;
}

export const VRChat = {
	async getCategorizedWorlds(): Promise<VRChatCategoriesResponse> {
		return api
			.url("vrchat/worlds/categories")
			.get()
			.json();
	},

	async getCategoryWorlds(category: string, page = 0): Promise<VRChatWorldsResponse> {
		return api
			.url(`vrchat/worlds/categories/${category}`)
			.query({ page })
			.get()
			.json();
	},

	async getActiveWorlds(page = 0): Promise<VRChatWorldsResponse> {
		return api
			.url("vrchat/worlds/active")
			.query({ page })
			.get()
			.json();
	},

	async searchWorlds(search: string, page = 0): Promise<VRChatWorldsResponse> {
		return api
			.url("vrchat/worlds/search")
			.query({ search, page })
			.get()
			.json();
	},

	async createInstance(worldId: string, conversationId: string): Promise<VRChatInstance> {
		return api
			.url("vrchat/instances")
			.json({ world_id: worldId, conversation_id: conversationId })
			.post()
			.json();
	}
};
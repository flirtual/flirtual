import { api, type CreatedAtModel } from "./common";

import type { ProspectKind } from "./matchmaking";

export type Message = CreatedAtModel & {
	id: string;
	content: ProspectKind;
	viewed: boolean;
	system: boolean;
	senderId: string;
};

export type Conversation = CreatedAtModel & {
	id: string;
	kind: ProspectKind;
	lastMessage?: Message;
	isUnread: boolean;
	userId: string;
};

export interface PaginateMetadata {
	total: number;
	cursor: {
		next?: string;
		previous?: string;
		self: {
			before?: string;
			limit: number;
			page: number;
		};
	};
}

export interface Paginate<T> {
	data: Array<T>;
	metadata: PaginateMetadata;
}

export type ConversationList = Paginate<Conversation>;

export const Conversation = {
	api: api.url("conversations"),
	get(conversationId: string) {
		return this.api
			.url(`/${conversationId}`)
			.get()
			.notFound(() => null)
			.json<Conversation | null>();
	},
	list(cursor?: string) {
		return this.api
			.query(cursor ? { cursor } : {})
			.get()
			.json<ConversationList>();
	},
	markRead() {
		return this.api.delete().res();
	},
	observe(options: { userId: string; targetId: string }) {
		return this.api.url("/observe").json(options).post().res();
	}
};

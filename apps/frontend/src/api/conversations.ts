import { CreatedAtModel } from "./common";
import { fetch, NarrowFetchOptions } from "./exports";
import { ProspectKind } from "./matchmaking";

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

export async function get(
	conversationId: string,
	options: NarrowFetchOptions = {}
): Promise<Conversation> {
	return fetch<Conversation>("get", `conversations/${conversationId}`, options);
}

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

export async function list(
	options: NarrowFetchOptions<undefined, { cursor?: string }>
): Promise<ConversationList> {
	return fetch<ConversationList>("get", "conversations", options);
}

export async function markRead(options: NarrowFetchOptions = {}) {
	return fetch("delete", "conversations/unread", options);
}

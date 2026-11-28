import type { WretchOptions } from "wretch";

import { api } from "./common";
import type { CreatedAtModel, CursorPaginate } from "./common";
import type { ProspectKind } from "./matchmaking";

export type Message = {
	id: string;
	content: string;
	viewed: boolean;
	system: boolean;
	kind?: "match";
	senderId: string;
} & CreatedAtModel;

export type Conversation = {
	id: string;
	kind: ProspectKind;
	lastMessage?: Message;
	isUnread: boolean;
	userId: string;
	participants?: Array<string>;
} & CreatedAtModel;

export type ConversationList = CursorPaginate<Conversation>;

export const Conversation = {
	api: api.url("conversations"),
	get(conversationId: string, options: WretchOptions = {}) {
		return this.api
			.url(`/${conversationId}`)
			.options(options)
			.get()
			.notFound(() => null)
			.json<Conversation | null>();
	},
	list(cursor?: string, options: WretchOptions = {}) {
		return this.api
			.query(cursor ? { cursor } : {})
			.options(options)
			.get()
			.json<ConversationList>();
	},
	token(options: WretchOptions = {}) {
		return this.api.url("/token").options(options).get().json<{ token: string; expiresIn: number }>();
	},
	markRead() {
		return this.api.url("/unread").delete().res();
	},
	leave(conversationId: string) {
		return this.api.url(`/${conversationId}`).delete().res();
	},
	observe(options: { userId: string; targetId: string }) {
		return this.api.url("/observe").json(options).post().res();
	}
};

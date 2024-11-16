import type { ConversationList } from "~/api/conversations";

export function getConversationsKey(page: number, list: ConversationList) {
	if (list && list.data.length < list.metadata.cursor.self.limit) return null;
	if (page === 0) return ["conversations", null];
	return ["conversations", list.metadata.cursor.next];
}

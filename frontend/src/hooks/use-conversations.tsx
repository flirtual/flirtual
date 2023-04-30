"use client";
import useSWRInfinite from "swr/infinite";

import { api } from "~/api";
import { ConversationList } from "~/api/conversations";

export const getKey = (page: number, list: ConversationList) => {
	if (!list || page === 0) return ["conversations", page];
	return ["conversations", list.metadata.cursor.next];
};

export function useConversations(fallbackData: ConversationList) {
	return useSWRInfinite(
		getKey,
		async ([, cursor]: [unknown, string]) => api.conversations.list({ query: { cursor } }),
		{
			suspense: true,
			fallbackData: [fallbackData]
		}
	);
}

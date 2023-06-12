"use client";
import { useCallback } from "react";
import useSWRInfinite from "swr/infinite";

import { api } from "~/api";
import { ConversationList } from "~/api/conversations";

export const getConversationsKey = (page: number, list: ConversationList) => {
	if (list && list.data.length < list.metadata.cursor.self.limit) return null;
	if (page === 0) return ["conversations", null];
	return ["conversations", list.metadata.cursor.next];
};

export function useConversations() {
	const {
		data = [],
		mutate,
		setSize
	} = useSWRInfinite(
		getConversationsKey,
		async ([, cursor]: [unknown, string]) =>
			api.conversations.list({ query: { cursor } }),
		{
			suspense: true
		}
	);

	const loadMore = useCallback(() => setSize((size) => size + 1), [setSize]);

	return { data, loadMore, mutate };
}

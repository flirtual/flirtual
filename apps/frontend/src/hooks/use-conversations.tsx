"use client";

import { useCallback } from "react";
import useSWRInfinite from "swr/infinite";

import { conversationsFetcher, conversationsKey } from "~/swr";

export function useConversations() {
	const {
		data = [],
		mutate,
		setSize
	} = useSWRInfinite(
		conversationsKey(),
		conversationsFetcher,
		{
			suspense: true,
			fallbackData: []
		}
	);

	const loadMore = useCallback(() => setSize((size) => size + 1), [setSize]);

	return { data, loadMore, mutate };
}

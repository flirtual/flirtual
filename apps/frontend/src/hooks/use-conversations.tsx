"use client";

import { useCallback } from "react";
import useSWRInfinite from "swr/infinite";

import { api } from "~/api";

import { getConversationsKey } from "./use-conversations.shared";

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

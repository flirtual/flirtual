import { use } from "react";

import { Conversation } from "~/api/conversations";
import { conversationFetcher, conversationKey, conversationsKey, invalidate, queryClient, useInfiniteQuery, useQuery } from "~/query";

export function preloadConversations() {
	return queryClient.prefetchInfiniteQuery({
		queryKey: conversationsKey(),
		queryFn: ({ pageParam }) => Conversation.list(pageParam),
		initialPageParam: undefined as unknown as string
	});
}

export function useConversations() {
	const { promise, fetchNextPage } = useInfiniteQuery({
		queryKey: conversationsKey(),
		queryFn: ({ pageParam }) => Conversation.list(pageParam),
		initialPageParam: undefined as unknown as string,
		getNextPageParam: ({ metadata: { cursor: { next } } }) => next,
		getPreviousPageParam: ({ metadata: { cursor: { previous } } }) => previous
	});
	const { pages } = use(promise);

	return {
		data: pages,
		loadMore: fetchNextPage,
		invalidate: () => invalidate({ queryKey: conversationsKey() })
	};
}

export function useConversation(conversationId: string) {
	return useQuery({
		queryKey: conversationKey(conversationId),
		queryFn: conversationFetcher,
	});
}

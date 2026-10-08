import { use } from "react";

import { Conversation } from "~/api/conversations";
import { conversationFetcher, conversationKey, conversationsKey, invalidate, queryClient, useInfiniteQuery, useQuery } from "~/query";

export function preloadConversations() {
	const queryKey = conversationsKey();

	if (queryClient.getQueryState(queryKey)) return;

	return queryClient.prefetchInfiniteQuery({
		queryKey,
		queryFn: ({ pageParam, signal }) => Conversation.list(pageParam, { signal }),
		initialPageParam: undefined as unknown as string
	});
}

function conversationsOptions() {
	return {
		queryKey: conversationsKey(),
		queryFn: ({ pageParam, signal }: { pageParam: string; signal: AbortSignal }) => Conversation.list(pageParam, { signal }),
		initialPageParam: undefined as unknown as string,
		getNextPageParam: ({ metadata: { next } }: Awaited<ReturnType<typeof Conversation.list>>) => next,
		getPreviousPageParam: ({ metadata: { previous } }: Awaited<ReturnType<typeof Conversation.list>>) => previous
	};
}

export function useConversations() {
	const { promise, fetchNextPage } = useInfiniteQuery(conversationsOptions());
	const { pages } = use(promise);

	return {
		data: pages,
		loadMore: fetchNextPage,
		invalidate: () => invalidate({ queryKey: conversationsKey() })
	};
}

export function useHasConversations() {
	const { data } = useInfiniteQuery(conversationsOptions());
	return !!data?.pages[0]?.data.length;
}

export function useConversation(conversationId: string) {
	return useQuery({
		queryKey: conversationKey(conversationId),
		queryFn: conversationFetcher,
	});
}

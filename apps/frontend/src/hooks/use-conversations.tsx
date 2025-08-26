import { use, useCallback } from "react";
import useSWRInfinite from "swr/infinite";
import { Conversation } from "~/api/conversations";

import { conversationsFetcher, conversationsKey, invalidate, useInfiniteQuery } from "~/query";

export function useConversations() {
    const { promise, fetchNextPage } = useInfiniteQuery({ 
        queryKey: conversationsKey(),
        queryFn: ({ pageParam }) => Conversation.list(pageParam),
        initialPageParam: undefined as unknown as string,
        getNextPageParam: ({metadata: {cursor: { next}}}) => next,
				getPreviousPageParam: ({metadata: {cursor: { previous}}}) => previous
    })

    const { pages } = use(promise);

    return {
        data: pages,
        loadMore: fetchNextPage,
        invalidate: () => invalidate({ queryKey: conversationsKey() })
    }

    // const {
    //     data = [],
    //     mutate,
    //     setSize
    // } = useSWRInfinite(
    //     conversationsKey(),
    //     conversationsFetcher,
    //     {
    //         suspense: true,
    //         fallbackData: []
    //     }
    // );
// 
    // const loadMore = useCallback(() => setSize((size) => size + 1), [setSize]);
// 
    // return { data, loadMore, mutate };
}

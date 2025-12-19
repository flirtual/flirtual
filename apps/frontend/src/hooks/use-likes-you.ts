import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";

import type { LikesYouFilters } from "~/api/matchmaking";
import { Matchmaking } from "~/api/matchmaking";
import {
	invalidate,
	likesYouKey,
	likesYouPreviewKey,
	queryClient,
	useQuery
} from "~/query";

export function preloadLikesYouPreview() {
	const queryKey = likesYouPreviewKey();

	if (queryClient.getQueryState(queryKey)) return;

	return queryClient.prefetchQuery({
		queryKey,
		queryFn: () => Matchmaking.likesYouPreview()
	});
}

export function useLikesYouPreview() {
	return useQuery({
		queryKey: likesYouPreviewKey(),
		queryFn: () => Matchmaking.likesYouPreview()
	});
}

export function preloadLikesYou(filters?: LikesYouFilters) {
	const queryKey = likesYouKey(filters);

	if (queryClient.getQueryState(queryKey)) return;

	return queryClient.prefetchInfiniteQuery({
		queryKey,
		queryFn: ({ pageParam }) => Matchmaking.likesYou(pageParam, filters),
		initialPageParam: undefined as unknown as string
	});
}

export function useLikesYou(filters?: LikesYouFilters) {
	const queryKey = likesYouKey(filters);
	const deferredQueryKey = useDeferredValue(queryKey);

	const { data, fetchNextPage } = useSuspenseInfiniteQuery({
		queryKey: deferredQueryKey,
		queryFn: ({ pageParam }) => Matchmaking.likesYou(pageParam, filters),
		initialPageParam: undefined as unknown as string,
		getNextPageParam: ({ metadata: { next } }) => next,
		getPreviousPageParam: ({ metadata: { previous } }) => previous
	});

	return {
		data: data.pages,
		loadMore: fetchNextPage,
		invalidate: () => invalidate({ queryKey: likesYouKey() })
	};
}

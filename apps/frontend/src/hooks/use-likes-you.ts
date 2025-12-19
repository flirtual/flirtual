import { use } from "react";

import { Matchmaking } from "~/api/matchmaking";
import {
	invalidate,
	likesYouKey,
	likesYouPreviewKey,
	queryClient,
	useInfiniteQuery,
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

export function preloadLikesYou() {
	const queryKey = likesYouKey();

	if (queryClient.getQueryState(queryKey)) return;

	return queryClient.prefetchInfiniteQuery({
		queryKey,
		queryFn: ({ pageParam }) => Matchmaking.likesYou(pageParam),
		initialPageParam: undefined as unknown as string
	});
}

export function useLikesYou() {
	const { promise, fetchNextPage } = useInfiniteQuery({
		queryKey: likesYouKey(),
		queryFn: ({ pageParam }) => Matchmaking.likesYou(pageParam),
		initialPageParam: undefined as unknown as string,
		getNextPageParam: ({ metadata: { next } }) => next,
		getPreviousPageParam: ({ metadata: { previous } }) => previous
	});
	const { pages } = use(promise);

	return {
		data: pages,
		loadMore: fetchNextPage,
		invalidate: () => invalidate({ queryKey: likesYouKey() })
	};
}

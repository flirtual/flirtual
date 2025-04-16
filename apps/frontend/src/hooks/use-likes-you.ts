import {
	likesYouFetcher,
	likesYouKey,
	useQuery,
} from "~/query";

export function useLikesYou() {
	return useQuery({
		queryKey: likesYouKey(),
		queryFn: likesYouFetcher,
	});
}

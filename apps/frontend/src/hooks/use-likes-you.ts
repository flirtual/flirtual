import {
	likesYouFetcher,
	likesYouKey,
	useSWR
} from "~/swr";

export function useLikesYou() {
	const { data } = useSWR(likesYouKey(), likesYouFetcher);
	return data;
}

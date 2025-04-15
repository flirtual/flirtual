import {
	likesYouFetcher,
	likesYouKey,
	useQuery,
} from "~/swr";

export function useLikesYou() {
	const { data } = useQuery({
		queryKey: likesYouKey(),
		queryFn: likesYouFetcher,
	});
	
	return data;
}

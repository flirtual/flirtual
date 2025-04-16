import { plansFetcher, plansKey, useQuery } from "~/query";

export function usePlans() {
	return useQuery({
		queryKey: plansKey(),
		queryFn: plansFetcher
	});
}

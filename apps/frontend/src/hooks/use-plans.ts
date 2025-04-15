import { plansFetcher, plansKey, useQuery } from "~/swr";

export function usePlans() {
	const { data: plans } = useQuery({
		queryKey: plansKey(),
		queryFn: plansFetcher
	});

	return plans;
}

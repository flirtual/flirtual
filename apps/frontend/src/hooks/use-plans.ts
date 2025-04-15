import { plansFetcher, plansKey, useSWR } from "~/swr";

export function usePlans() {
	const { data: plans } = useSWR(plansKey(), plansFetcher, {
		revalidateOnFocus: false
	});

	return plans;
}

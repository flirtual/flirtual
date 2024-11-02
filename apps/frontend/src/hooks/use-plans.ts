import useSWR from "swr";

import { Plan } from "~/api/plan";

export function usePlans() {
	const { data: plans } = useSWR("plans", () => Plan.list(), {
		revalidateOnFocus: false,
		revalidateIfStale: false,
		suspense: true
	});

	return plans;
}

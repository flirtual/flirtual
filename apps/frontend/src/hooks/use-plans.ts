import useSWR from "swr";

import { Plan } from "~/api/plan";

export function usePlans() {
	const { data: plans } = useSWR("plans", () => Plan.list(), {
		suspense: true
	});

	return plans;
}

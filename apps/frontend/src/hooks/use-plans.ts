import useSWR from "swr";

import { api } from "~/api";

export function usePlans() {
	const { data: plans } = useSWR("plans", () => api.plan.list(), {});

	return plans;
}

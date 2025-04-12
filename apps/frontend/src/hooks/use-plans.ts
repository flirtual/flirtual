import { Plan } from "~/api/plan";
import { useSWR } from "~/swr";

export function usePlans() {
	const { data: plans } = useSWR("plans", () => Plan.list(), {
		revalidateOnFocus: false,
		revalidateIfStale: false,
		suspense: true
	});

	return plans;
}

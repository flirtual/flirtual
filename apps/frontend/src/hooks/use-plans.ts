import { useLocale } from "~/i18n";
import { plansFetcher, plansKey, useQuery } from "~/query";

export function usePlans() {
	const [locale] = useLocale();

	return useQuery({
		queryKey: plansKey(locale),
		queryFn: plansFetcher
	});
}

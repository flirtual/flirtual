import type { Config } from "~/api/config";
import { configFetcher, configKey, useQuery } from "~/query";

export function useConfig(): Config {
	return useQuery({
		queryKey: configKey(),
		queryFn: configFetcher
	});
}

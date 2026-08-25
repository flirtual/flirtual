import ms from "ms" with { type: "macro" };

import type { Config } from "~/api/config";
import { configFetcher, configKey, useQuery } from "~/query";

export function useConfig(): Config {
	return useQuery({
		queryKey: configKey(),
		queryFn: configFetcher,
		staleTime: ms("15m"),
		refetchInterval: ms("15m"),
		refetchOnWindowFocus: "always"
	});
}

export function ConfigSubscriber() {
	useConfig();
	return null;
}

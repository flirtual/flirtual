"use client";

import ms from "ms";

import type { ProspectKind } from "~/api/matchmaking";
import { queueFetcher, queueKey, useQuery } from "~/query";

export function useQueue(kind: ProspectKind) {
	return useQuery({
		queryKey: queueKey(kind),
		queryFn: queueFetcher,
		refetchInterval: ms("1m"),
	});
}

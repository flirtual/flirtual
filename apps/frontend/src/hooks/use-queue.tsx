"use client";

import ms from "ms";

import type { ProspectKind } from "~/api/matchmaking";
import { queueFetcher, queueKey, useSWR } from "~/swr";

export function useQueue(kind: ProspectKind) {
	return useSWR(queueKey(kind), queueFetcher, {
		refreshInterval: ms("1m"),
	});
}

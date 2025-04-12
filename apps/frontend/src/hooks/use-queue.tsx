"use client";

import ms from "ms";

import type { ProspectKind } from "~/api/matchmaking";
import { Matchmaking } from "~/api/matchmaking";
import { queueKey, useSWR } from "~/swr";

export function useQueue(kind: ProspectKind) {
	return useSWR(queueKey(kind), ([, kind]) => Matchmaking.queue(kind), {
		suspense: true,
		refreshInterval: ms("1m"),
	});
}

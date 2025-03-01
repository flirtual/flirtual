"use client";
import ms from "ms";
import useSWR from "swr";

import { Matchmaking, type ProspectKind } from "~/api/matchmaking";
import { queueKey } from "~/swr";

export function useQueue(kind: ProspectKind) {
	return useSWR(queueKey(kind), ([, kind]) => Matchmaking.queue(kind), {
		suspense: true,
		refreshInterval: ms("1m")
	});
}

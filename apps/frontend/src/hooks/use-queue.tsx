import useSWR from "swr";

import { Matchmaking, type ProspectKind } from "~/api/matchmaking";

export const queueKey = (kind: ProspectKind) => ["queue", kind] as const;

export function useQueue(kind: ProspectKind) {
	return useSWR(queueKey(kind), ([, kind]) => Matchmaking.queue(kind), {
		suspense: true
	});
}

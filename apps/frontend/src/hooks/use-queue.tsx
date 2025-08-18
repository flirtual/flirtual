import ms from "ms.macro";
import { useCallback } from "react";

import type { Issue } from "~/api/common";
import { isWretchError } from "~/api/common";
import type { Queue, QueueIssue } from "~/api/matchmaking";
import { Matchmaking, ProspectKind } from "~/api/matchmaking";
import { log } from "~/log";
import {
	invalidate,
	mutate,
	preload,
	queueKey,
	useMutation,
	useQuery,
	userFetcher,
	userKey
} from "~/query";

export const invalidateQueue = (mode: ProspectKind = "love") => invalidate({ queryKey: queueKey(mode) });

export function useQueue(mode: ProspectKind = "love") {
	if (!ProspectKind.includes(mode)) mode = "love";
	const queryKey = queueKey(mode);

	const queue = useQuery<Queue | QueueIssue, typeof queryKey>({
		queryKey,
		queryFn: async ({ queryKey: [, mode] }) =>
			Matchmaking
				.queue(mode)
				.catch((reason) => {
					if (!isWretchError(reason)) throw reason;
					const issue = reason.json as Issue;

					if (!["confirm_email", "finish_profile"].includes(issue.error)) throw reason;
					return issue as QueueIssue;
				}),
		refetchInterval: ms("1m"),
		staleTime: 0,
		meta: {
			cacheTime: 0
		}
	});

	const previous = "previous" in queue ? queue.previous : null;
	const next = "next" in queue ? queue.next : [];

	const error = "error" in queue ? queue.error : null;

	Promise.all(next.map((userId) => preload({
		queryKey: userKey(userId),
		queryFn: userFetcher
	})));

	const [current] = next;

	const forward = useCallback(() => mutate<Queue>(queryKey, (queue) => {
		if (!queue) return queue;

		// x ... y ... z
		// y <-- z ... ?
		const { next: [current, ...next] } = queue;
		if (!current) return queue;

		return {
			previous: current,
			next,
		};
	}), [queryKey]);

	const backward = useCallback(() => mutate<Queue>(queryKey, (queue) => {
		if (!queue) return queue;

		// x ... y ... z
		// ? ... x --> y
		const { previous, next } = queue;

		return {
			previous: null,
			next: [previous, ...next],
		};
	}), [queryKey]);

	const { mutateAsync } = useMutation<Queue, {
		action: "like" | "pass" | "undo";
		userId: string;
		kind: ProspectKind;
	}>({
		mutationKey: queryKey,
		onMutate: ({ action }) => ({
			like: forward,
			pass: forward,
			undo: backward
		})[action](),
		mutationFn: async ({
			action,
			userId,
			kind
		}) => {
			log(action, { userId, kind, mode });

			const { queue } = action === "undo"
				? await Matchmaking.undo({ mode })
				: await Matchmaking.queueAction({ type: action, kind, mode, userId });

			return queue;
		}
	});

	return {
		error,
		previous,
		next,
		like: (kind: ProspectKind = mode, userId: string = current!) => mutateAsync({ action: "like", userId, kind }),
		pass: (kind: ProspectKind = mode, userId: string = current!) => mutateAsync({ action: "pass", userId, kind }),
		undo: (kind: ProspectKind = mode) => mutateAsync({ action: "undo", userId: current!, kind }),
		invalidate: () => invalidateQueue(mode),
		forward,
		backward
	};
}

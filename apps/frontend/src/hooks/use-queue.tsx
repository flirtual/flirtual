"use client";

import ms from "ms";
import { useCallback } from "react";

import type { ProspectKind } from "~/api/matchmaking";
import { log } from "~/log";
import { mutate, queueKey, useMutation, useQuery } from "~/query";

interface Queue {
	history: Array<string>;
	next: Array<string>;
}

export function useQueue(mode: ProspectKind = "love") {
	const queryKey = queueKey(mode);

	const { history, next } = useQuery<Queue>({
		queryKey,
		queryFn: () => ({
			history: [],
			next: [
				"W8a9gvC9vVt4EzS7zxnLJJ",
				"t8p8NedKpcZps2Z5w7tyxR",
			]
		}),

		refetchInterval: ms("1m"),
		staleTime: 0,
		meta: {
			cacheTime: 0
		}
	});

	const [current] = next;

	const forward = useCallback(() => mutate<Queue>(queryKey, (queue) => {
		if (!queue) return queue;

		const { history, next: [current, ...next] } = queue;
		if (!current) return queue;

		return {
			history: [current, ...history],
			next,
		};
	}), [queryKey]);

	const backward = useCallback(() => mutate<Queue>(queryKey, (queue) => {
		if (!queue) return queue;

		const { history: [current, ...history], next } = queue;
		if (!current) return queue;

		return {
			history,
			next: [current, ...next],
		};
	}), [queryKey]);

	const { mutateAsync } = useMutation({
		mutationKey: queryKey,
		// onMutate: forward,
		mutationFn: async ({
			action,
			userId,
			kind
		}: {
			action: "like" | "pass" | "undo";
			userId: string;
			kind: ProspectKind;
		}) => {
			log("like", { action, userId, kind, mode });
		}
	});

	return {
		history,
		next,
		like: (kind: ProspectKind = mode, userId: string = current!) => mutateAsync({ action: "like", userId, kind }),
		pass: (kind: ProspectKind = mode, userId: string = current!) => mutateAsync({ action: "pass", userId, kind }),
		undo: (kind: ProspectKind = mode) => mutateAsync({ action: "undo", userId: current!, kind }),
		forward,
		backward
	};
}

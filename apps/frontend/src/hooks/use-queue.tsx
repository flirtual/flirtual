"use client";

import ms from "ms";
import { useCallback } from "react";

import { Matchmaking, ProspectKind } from "~/api/matchmaking";
import { log } from "~/log";
import { invalidate, mutate, preload, queueKey, useMutation, useQuery, userFetcher, userKey } from "~/query";

interface Queue {
	history: Array<string>;
	next: Array<string>;
}

export const invalidateQueue = (mode: ProspectKind = "love") => invalidate({ queryKey: queueKey(mode) });

export function useQueue(mode: ProspectKind = "love") {
	if (!ProspectKind.includes(mode)) mode = "love";
	const queryKey = queueKey(mode);

	const { history, next } = useQuery<Queue, typeof queryKey>({
		queryKey,
		queryFn: async ({ queryKey: [, mode] }) => {
			const [previous, current, next] = await Matchmaking.queue(mode);

			return ({
				history: previous
					? [
							previous
						]
					: [],
				next: [
					current,
					next
				].filter(Boolean)
			});
		},
		refetchInterval: ms("1m"),
		staleTime: 0,
		meta: {
			cacheTime: 0
		}
	});

	Promise.all(next.map((userId) => preload({
		queryKey: userKey(userId),
		queryFn: userFetcher
	})));

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
		onMutate: ({ action }) => ({
			like: forward,
			pass: forward,
			undo: backward
		})[action](),
		mutationFn: async ({
			action,
			userId,
			kind
		}: {
			action: "like" | "pass" | "undo";
			userId: string;
			kind: ProspectKind;
		}) => {
			log(action, { userId, kind, mode });
		}
	});

	return {
		history,
		next,
		like: (kind: ProspectKind = mode, userId: string = current!) => mutateAsync({ action: "like", userId, kind }),
		pass: (kind: ProspectKind = mode, userId: string = current!) => mutateAsync({ action: "pass", userId, kind }),
		undo: (kind: ProspectKind = mode) => mutateAsync({ action: "undo", userId: current!, kind }),
		invalidate: () => invalidateQueue(mode),
		forward,
		backward
	};
}

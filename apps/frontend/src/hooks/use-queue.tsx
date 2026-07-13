import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import { isWretchError } from "~/api/common";
import type { Queue, QueueActionIssue, QueueIssue } from "~/api/matchmaking";
import { Matchmaking, ProspectKind, prospectKinds } from "~/api/matchmaking";
import { ItsAMatch } from "~/app/[locale]/(app)/(authenticated)/(onboarded)/discover/its-a-match";
import { OutOfLikesPasses } from "~/app/[locale]/(app)/(authenticated)/(onboarded)/discover/out-of-likes-passes";
import { preloadProfile } from "~/components/profile";
import { log } from "~/log";
import {
	conversationsKey,
	invalidate,
	likesYouKey,
	likesYouPreviewKey,
	mutate,
	queryClient,
	queueFetcher,
	queueKey,
	relationshipKey,
	useMutation,
	useQuery,
	userKey,
} from "~/query";
import { emptyArray, newConversationId } from "~/utilities";

import { useDialog } from "./use-dialog";
import { useSession } from "./use-session";
import { useUnreadConversations } from "./use-talkjs";

export const invalidateQueue = (mode: ProspectKind = "love") => invalidate({ queryKey: queueKey(mode) });

// Consecutive likes per mode. A module-level store rather than component
// state, because useQueue() mounts in several components that share one count.
const likeStreaks = new Map<ProspectKind, number>();
const likeStreakListeners = new Set<() => void>();

function setLikeStreak(mode: ProspectKind, value: number) {
	likeStreaks.set(mode, value);
	likeStreakListeners.forEach((listener) => listener());
}

function useLikeStreak(mode: ProspectKind) {
	return useSyncExternalStore(
		(onChange) => {
			likeStreakListeners.add(onChange);
			return () => likeStreakListeners.delete(onChange);
		},
		() => likeStreaks.get(mode) ?? 0
	);
}

export function invalidateMatch(userId: string) {
	queryClient.removeQueries({ queryKey: likesYouKey() });
	return Promise.all([
		invalidate({ queryKey: userKey(userId) }),
		invalidate({ queryKey: relationshipKey(userId) }),
		invalidate({ queryKey: likesYouPreviewKey() }),
		invalidate({ queryKey: conversationsKey() })
	]);
}

export function useQueue(mode: ProspectKind = "love") {
	if (!ProspectKind.includes(mode)) mode = "love";
	const { user: { id: meId } } = useSession();
	const { setUnreadConversations } = useUnreadConversations();
	const queryKey = useMemo(() => queueKey(mode), [mode]);
	const dialogs = useDialog();

	const likeStreak = useLikeStreak(mode);

	const queue = useQuery<Queue | QueueIssue, typeof queryKey>({
		queryKey,
		queryFn: queueFetcher,
		// The queue recomputes in the background; poll briefly while it's empty
		// and a recompute is pending.
		refetchInterval: (query) => {
			const data = query.state.data;
			return data && "pending" in data && data.pending && data.next.length === 0
				? 2000
				: false;
		}
	});

	const previous = "previous" in queue ? queue.previous : null;
	const next = "next" in queue ? queue.next : emptyArray;
	const canUndo = "canUndo" in queue ? queue.canUndo && !!previous : false;
	const notice = "notice" in queue ? queue.notice : null;
	const pending = "pending" in queue ? queue.pending : false;

	const error = "error" in queue ? queue.error : null;

	// Preload so undo doesn't suspend Queue.
	useEffect(() => {
		void Promise.all(
			[previous, ...next]
				.filter((userId): userId is string => !!userId)
				.map((userId) => preloadProfile(userId))
		);
	}, [previous, next]);

	const [current] = next;

	const forward = useCallback(() => mutate<Queue>(queryKey, (queue) => {
		if (!queue) return queue;

		// x ... y ... z
		// y <-- z ... ?
		const { next: [current, ...next] } = queue;
		if (!current) return queue;

		return {
			...queue,
			previous: current,
			next,
			canUndo: true,
		};
	}), [queryKey]);

	const backward = useCallback(() => mutate<Queue>(queryKey, (queue) => {
		if (!queue) return queue;

		// x ... y ... z
		// ? ... x --> y
		const { previous, next } = queue;

		return {
			...queue,
			previous: null,
			next: [previous, ...next].filter((id): id is string => !!id),
			canUndo: false,
		};
	}), [queryKey]);

	const remove = useCallback((userId: string, kind: ProspectKind = mode) => mutate<Queue>(queueKey(kind), (queue) => {
		if (!queue) return queue;

		return {
			...queue,
			next: queue.next.filter((id) => id !== userId),
		};
	}), [mode]);

	const removeAll = useCallback(async (userId: string) => {
		await Promise.all(prospectKinds.map((kind) => remove(userId, kind)));
	}, [remove]);

	const { mutateAsync, isPending: mutating } = useMutation<Queue | QueueIssue | undefined, {
		action: "like" | "pass" | "undo";
		userId: string;
	}>({
		mutationKey: queryKey,
		onMutate: ({ action, userId }) => {
			setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);

			if (action !== "undo" && userId !== current)
				return removeAll(userId);

			return ({
				like: forward,
				pass: forward,
				undo: backward
			})[action]();
		},
		mutationFn: async ({
			action,
			userId
		}) => {
			log(action, { userId, mode });

			try {
				const { queue, match, matchKind, userId: finalUserId } = action === "undo"
					? await Matchmaking.undo({ mode })
					: await Matchmaking.queueAction({ type: action, mode, userId });

				void invalidateMatch(finalUserId);
				const conversationId = await newConversationId(meId, finalUserId);

				if (action === "undo")
					// HACK: Talk.js doesn't send us an update event when we manually delete a conversation on un-match.
					setUnreadConversations((unreadConversations) => {
						return unreadConversations.filter(({ conversation }) => conversation.id !== conversationId);
					});

				if (match) {
					const dialog = (
						<ItsAMatch
							conversationId={conversationId}
							kind={matchKind ?? "love"}
							userId={userId}
							onClose={() => dialogs.remove(dialog)}
						/>
					);

					dialogs.add(dialog);
				}

				// Keep the optimistic head so a mismatched next[0] from the server doesn't trigger a second
				// key change in AnimatePresence and orphan the previous Profile.
				await queryClient.cancelQueries({ queryKey });
				queryClient.setQueryData<Queue>(queryKey, (cache) => {
					if (action === "undo" || !cache || !("next" in cache) || !cache.next[0])
						return queue;

					const head = cache.next[0];
					return {
						...queue,
						next: [head, ...queue.next.filter((id) => id !== head)],
					};
				});

				if (action === "like") setLikeStreak(mode, (likeStreaks.get(mode) ?? 0) + 1);
				else setLikeStreak(mode, 0);
			}
			catch (reason) {
				if (!isWretchError(reason)) throw reason;

				const issue = reason.json as QueueActionIssue;

				if (issue.error === "confirm_email" || issue.error === "finish_profile") return issue;

				await invalidate({ queryKey });
				if (
					issue.error === "already_responded"
					|| issue.error === "already_undone"
					|| issue.error === "nothing_to_undo"
					|| issue.error === "blocked"
				) return;

				if (issue.error !== "out_of_likes" && issue.error !== "out_of_browses") throw reason;
				const { details: { reset_at } } = issue;

				const dialog = (
					<OutOfLikesPasses
						reset={async () => {
							await invalidate({ queryKey });
							dialogs.remove(dialog);
						}}
						mode={mode}
						resetAt={reset_at}
					/>
				);

				dialogs.add(dialog);
			}
		},
		onSettled: () => invalidateQueue(({ love: "friend", friend: "love" } as const)[mode])
	});

	return {
		error,
		previous,
		next,
		canUndo,
		notice,
		pending,
		likeStreak,
		like: (userId: string = current!) => mutateAsync({ action: "like", userId }),
		pass: (userId: string = current!) => mutateAsync({ action: "pass", userId }),
		undo: () => mutateAsync({ action: "undo", userId: previous! }),
		invalidate: () => invalidateQueue(mode),
		mutating,
		forward,
		backward,
		remove,
		removeAll
	};
}

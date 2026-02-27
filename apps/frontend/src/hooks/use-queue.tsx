import { useCallback, useEffect, useMemo } from "react";

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

	const queue = useQuery<Queue | QueueIssue, typeof queryKey>({
		queryKey,
		queryFn: queueFetcher,
		// refetchInterval: ms("1m"),
		// staleTime: 0,
		// meta: {
		// 	cacheTime: 0
		// }
	});

	const previous = "previous" in queue ? queue.previous : null;
	const next = "next" in queue ? queue.next : emptyArray;

	const error = "error" in queue ? queue.error : null;

	useEffect(() => void Promise.all(next.map((userId) => preloadProfile(userId))), [next]);

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
		kind: ProspectKind;
	}>({
		mutationKey: queryKey,
		onMutate: ({ action, userId }) => {
			setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);

			if (userId !== current)
				return remove(userId);

			return ({
				like: forward,
				pass: forward,
				undo: backward
			})[action]();
		},
		mutationFn: async ({
			action,
			userId,
			kind
		}) => {
			log(action, { userId, kind, mode });

			try {
				const { queue, match, matchKind, userId: finalUserId } = action === "undo"
					? await Matchmaking.undo({ mode })
					: await Matchmaking.queueAction({ type: action, kind, mode, userId });

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
							kind={matchKind}
							userId={userId}
							onClose={() => dialogs.remove(dialog)}
						/>
					);

					dialogs.add(dialog);
				}

				return queue;
			}
			catch (reason) {
				if (!isWretchError(reason)) throw reason;

				const issue = reason.json as QueueActionIssue;

				if (issue.error === "confirm_email" || issue.error === "finish_profile") return issue;

				await invalidate({ queryKey });
				if (issue.error === "already_responded") return;

				if (issue.error !== "out_of_likes" && issue.error !== "out_of_passes") throw reason;
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
		like: (kind: ProspectKind = mode, userId: string = current!) => mutateAsync({ action: "like", userId, kind }),
		pass: (kind: ProspectKind = mode, userId: string = current!) => mutateAsync({ action: "pass", userId, kind }),
		undo: (kind: ProspectKind = mode) => mutateAsync({ action: "undo", userId: current!, kind }),
		invalidate: () => invalidateQueue(mode),
		mutating,
		forward,
		backward,
		remove,
		removeAll
	};
}

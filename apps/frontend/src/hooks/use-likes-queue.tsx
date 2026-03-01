import type { InfiniteData } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { isWretchError } from "~/api/common";
import type { LikeAndPassItem, LikesYouFilters, LikesYouList, ProspectKind, QueueActionIssue } from "~/api/matchmaking";
import { Matchmaking } from "~/api/matchmaking";
import { ItsAMatch } from "~/app/[locale]/(app)/(authenticated)/(onboarded)/discover/its-a-match";
import { preloadProfile } from "~/components/profile";
import { useNavigate } from "~/i18n";
import { log } from "~/log";
import {
	conversationsKey,
	invalidate,
	likesYouKey,
	likesYouPreviewKey,
	mutate,
	relationshipKey,
	useMutation,
	userKey,
} from "~/query";
import { urls } from "~/urls";
import { newConversationId } from "~/utilities";

import { useDialog } from "./use-dialog";
import { useLikesYou } from "./use-likes-you";
import { invalidateQueue } from "./use-queue";
import { useSession } from "./use-session";

function invalidateMatch(userId: string) {
	return Promise.all([
		invalidate({ queryKey: userKey(userId) }),
		invalidate({ queryKey: relationshipKey(userId) }),
		invalidate({ queryKey: likesYouKey() }),
		invalidate({ queryKey: likesYouPreviewKey() }),
		invalidate({ queryKey: conversationsKey() })
	]);
}

export interface UseLikesQueueOptions {
	filters?: LikesYouFilters;
	initialUserId?: string;
}

export function useLikesQueue(mode: ProspectKind = "love", options: UseLikesQueueOptions = {}) {
	const { filters, initialUserId } = options;

	const { user: { id: meId } } = useSession();
	const dialogs = useDialog();
	const navigate = useNavigate();

	const queryKey = useMemo(() => likesYouKey(filters), [filters]);
	const { data, loadMore, hasMore } = useLikesYou(filters);
	const profileIds = useMemo(
		() => data.flatMap((page) => page.data.map((item) => item.profileId)),
		[data]
	);

	const [previous, setPrevious] = useState<LikeAndPassItem | null>(null);

	const current = useMemo(() => {
		if (initialUserId && profileIds.includes(initialUserId))
			return initialUserId;
		return profileIds[0] ?? null;
	}, [profileIds, initialUserId]);

	const forward = useCallback((userId: string, action: "like" | "pass") => {
		if (action === "pass") {
			const item = data.flatMap((page) => page.data).find((entry) => entry.profileId === userId);
			if (item) setPrevious(item);
		}
		else {
			setPrevious(null);
		}

		return mutate<InfiniteData<LikesYouList>>(queryKey, (old) => {
			if (!old) return old;
			return {
				...old,
				pages: old.pages.map((page) => ({
					...page,
					data: page.data.filter((entry) => entry.profileId !== userId)
				}))
			};
		});
	}, [queryKey, data]);

	const backward = useCallback(() => {
		if (!previous) return;
		const item = previous;
		setPrevious(null);

		return mutate<InfiniteData<LikesYouList>>(queryKey, (old) => {
			if (!old || old.pages.length === 0) return old;
			const [firstPage, ...restPages] = old.pages;
			return {
				...old,
				pages: [
					{ ...firstPage, data: [item, ...firstPage.data] },
					...restPages
				]
			};
		});
	}, [queryKey, previous]);

	const currentIndex = current ? profileIds.indexOf(current) : -1;
	useEffect(() => {
		if (profileIds.length <= 3) void loadMore();
	}, [profileIds.length, loadMore]);

	useEffect(() => {
		if (!current && !hasMore) navigate(urls.likes);
	}, [current, hasMore, navigate]);

	useEffect(() => {
		if (currentIndex < 0) return;
		void Promise.all(
			profileIds.slice(currentIndex, currentIndex + 4).map((userId) => preloadProfile(userId))
		);
	}, [profileIds, currentIndex]);

	const { mutateAsync, isPending: mutating } = useMutation<void, {
		action: "like" | "pass" | "undo";
		userId: string;
		kind: ProspectKind;
	}>({
		mutationKey: ["likes-queue", mode],
		onMutate: ({ action, userId }) => {
			setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);

			if (action === "undo") return backward();
			return forward(userId, action);
		},
		mutationFn: async ({ action, userId, kind }) => {
			log(action, { userId, kind, mode, source: "likes" });

			try {
				if (action === "undo") {
					await Matchmaking.unmatch(userId);
					void invalidateMatch(userId);
					return;
				}

				const { match, matchKind } = await Matchmaking.queueAction({
					type: action,
					kind,
					mode,
					userId
				});

				void invalidateMatch(userId);
				const conversationId = await newConversationId(meId, userId);

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
			}
			catch (reason) {
				if (!isWretchError(reason)) throw reason;

				const issue = reason.json as QueueActionIssue;
				if (issue.error === "already_responded") return;

				throw reason;
			}
		},
		onSettled: () => {
			invalidateQueue("love");
			invalidateQueue("friend");
		}
	});

	return {
		previous,
		current,
		like: (kind: ProspectKind = mode, userId: string = current!) => mutateAsync({ action: "like", userId, kind }),
		pass: (kind: ProspectKind = mode, userId: string = current!) => mutateAsync({ action: "pass", userId, kind }),
		undo: (kind: ProspectKind = mode) => mutateAsync({ action: "undo", userId: previous!.profileId, kind }),
		mutating
	};
}

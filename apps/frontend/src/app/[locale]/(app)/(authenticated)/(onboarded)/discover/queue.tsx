import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { AnimatePresence, m } from "motion/react";
import type { FC } from "react";
import { withSuspense } from "with-suspense";

import { Matchmaking, prospectKinds } from "~/api/matchmaking";
import type { ProspectKind, Queue as QueueData } from "~/api/matchmaking";
import { Profile } from "~/components/profile";
import { ProfileSkeleton } from "~/components/profile/skeleton";
import { useDevice } from "~/hooks/use-device";
import { useQueue } from "~/hooks/use-queue";
import { useSession } from "~/hooks/use-session";
import { useDefaultTour } from "~/hooks/use-tour";
import { useUser } from "~/hooks/use-user";
import { invalidate, queryClient, queueKey, useMutation, userKey } from "~/query";

import { ConfirmEmailError, FinishProfileError, OutOfProspects } from "./out-of-prospects";
import { QueueActions } from "./queue-actions";

function DefaultTour() {
	const { user } = useSession();
	const { vision } = useDevice();
	useDefaultTour(!user.moderatorMessage && !vision);

	return null;
}

const SkipStaleProspect: FC<{ userId: string }> = ({ userId }) => {
	const mutation = useMutation({
		mutationKey: ["skip-prospect", userId],
		mutationFn: () => Matchmaking.skipProspect(userId),
		onError: () => invalidate({ queryKey: userKey(userId) }),
		onSettled: () => {
			prospectKinds.forEach((mode) => {
				queryClient.setQueryData<QueueData>(queueKey(mode), (queue) => queue && {
					previous: queue.previous === userId ? null : queue.previous,
					next: queue.next.filter((id) => id !== userId)
				});
				// Refetch queue if empty.
				const next = queryClient.getQueryData<QueueData>(queueKey(mode))?.next;
				if (next && next.length === 0) void invalidate({ queryKey: queueKey(mode) });
			});
		}
	});

	if (mutation.isIdle) mutation.mutate();
	return null;
};

// motion: Suspense breaks exit animations.
// https://github.com/motiondivision/motion/issues/2690
// https://github.com/motiondivision/motion/issues/2269
const CurrentProfile = withSuspense<{ userId: string }>(({ userId }) => {
	const user = useUser(userId);
	if (!user) return <SkipStaleProspect userId={userId} />;

	return <Profile userId={userId} />;
}, { fallback: <ProfileSkeleton /> });

export const Queue: FC<{ kind: ProspectKind }> = ({ kind }) => {
	const { error, next: [current] } = useQueue(kind);
	// const { error, next: [current, next], previous } = useQueue(kind);

	const skipping = useIsMutating({ mutationKey: ["skip-prospect"] }) > 0;
	const queueing = useIsMutating({ mutationKey: queueKey(kind) }) > 0;
	const fetchingQueue = useIsFetching({ queryKey: queueKey(kind) }) > 0;

	if (error === "finish_profile")
		return <FinishProfileError />;

	if (error === "confirm_email")
		return <ConfirmEmailError />;

	if (!current) {
		if (skipping || queueing || fetchingQueue) return null;
		return <OutOfProspects mode={kind} />;
	}

	return (
		<>
			{kind === "love" && <DefaultTour />}

			<div className="relative w-full max-w-full gap-4 desktop:w-auto">
				<AnimatePresence initial={false}>
					<m.div
						key={current}
						animate={{ opacity: 1 }}
						className="relative top-0 z-10"
						exit={{ opacity: 0, position: "absolute" }}
						initial={{ opacity: 0 }}
					>
						<CurrentProfile userId={current} />
					</m.div>
				</AnimatePresence>
			</div>

			<QueueActions kind={kind} />

			{/*
				<div
					className="relative top-0 z-10 grid grid-cols-3 gap-4"
				>
					{previous ? <Profile userId={previous} /> : <div />}
					{current ? <Profile userId={current} /> : <div />}
					{next ? <Profile userId={next} /> : <div />}
				</div>
			*/}
		</>
	);
};

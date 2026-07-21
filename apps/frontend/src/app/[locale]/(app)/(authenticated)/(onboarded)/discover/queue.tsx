import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import { Matchmaking, prospectKinds } from "~/api/matchmaking";
import type { ProspectKind, Queue as QueueData, QueueResponse } from "~/api/matchmaking";
import { ButtonLink } from "~/components/button";
import { Profile } from "~/components/profile";
import { ProfileSkeleton } from "~/components/profile/skeleton";
import { useDevice } from "~/hooks/use-device";
import { useDismissed } from "~/hooks/use-dismissed";
import { useQueue } from "~/hooks/use-queue";
import { useSession } from "~/hooks/use-session";
import { useDefaultTour } from "~/hooks/use-tour";
import { useUser } from "~/hooks/use-user";
import { invalidate, mutate, queryClient, queueKey, useMutation, userKey } from "~/query";
import { urls } from "~/urls";

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
					...queue,
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

// The profile currently on screen. Switching modes remounts the queue, which
// carries the profile over so you can Homie someone you found in Date Mode and
// vice versa.
let displayedProfile: { userId: string; mode: ProspectKind } | null = null;

// Whether the mode's daily (or trial) limits are spent, per the last queue
// response seen for it.
function limitsReached(mode: ProspectKind) {
	const queue = queryClient.getQueryData<QueueResponse>(queueKey(mode));
	if (!queue || !("limits" in queue) || !queue.limits) return false;

	const { likes, browses, resetAt } = queue.limits;
	if (resetAt && new Date(resetAt).getTime() <= Date.now()) return false;

	return likes.used >= likes.max || browses.used >= browses.max;
}

const noticeClassName
	= "relative z-20 flex w-full flex-col gap-3 rounded-xl bg-white-10 p-4 font-nunito shadow-brand-1 dark:bg-black-70 desktop:max-w-lg";

const DontShowAgain: FC<{ onClick: () => void }> = ({ onClick }) => {
	const { t } = useTranslation();

	return (
		<button
			className="pl-1 text-sm text-pink opacity-75 transition-opacity hocus:opacity-100"
			type="button"
			onClick={onClick}
		>
			{t("dont_show_again")}
		</button>
	);
};

const FallbackNotice: FC<{ mode: ProspectKind }> = ({ mode }) => {
	const { t } = useTranslation();
	const [hidden, hide] = useDismissed("fallback_notice");

	const { mutate: dismiss } = useMutation({
		mutationKey: ["dismiss-notice", mode],
		mutationFn: async () => {
			await mutate<QueueData>(queueKey(mode), (queue) => queue && { ...queue, notice: null });
			await Matchmaking.dismissNotice(mode);
		}
	});

	if (hidden) return null;

	return (
		<div className={noticeClassName}>
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col">
					<span>{t("queue_fallback_notice")}</span>
					<details>
						<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
							{t("more_info")}
						</summary>
						{t("queue_fallback_notice_details")}
					</details>
				</div>
				<button
					className="shrink-0 opacity-75 hocus:opacity-100"
					type="button"
					onClick={() => dismiss()}
				>
					<X className="size-5" />
				</button>
			</div>
			<div className="flex items-center justify-between gap-3">
				<DontShowAgain onClick={() => hide()} />
				<ButtonLink href={urls.settings.matchmaking()} size="sm">
					{t("update_filters")}
				</ButtonLink>
			</div>
		</div>
	);
};

const likeStreakThreshold = 8;

// Warning shown if a user has liked 8 or more profiles in a row (cleared by a
// pass, which resets the streak, or dismissed for this run).
const StreakNotice: FC<{ streak: number }> = ({ streak }) => {
	const { t } = useTranslation();
	const [hidden, hide] = useDismissed("liking_streak_notice");
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		if (streak < likeStreakThreshold) setDismissed(false);
	}, [streak]);

	if (hidden || dismissed || streak < likeStreakThreshold) return null;

	return (
		<div className={noticeClassName}>
			<div className="flex items-start justify-between gap-4">
				<span>{t("queue_liking_streak_notice")}</span>
				<button
					className="shrink-0 opacity-75 hocus:opacity-100"
					type="button"
					onClick={() => setDismissed(true)}
				>
					<X className="size-5" />
				</button>
			</div>
			<div className="flex">
				<DontShowAgain onClick={() => hide()} />
			</div>
		</div>
	);
};

export const Queue: FC<{ kind: ProspectKind }> = ({ kind }) => {
	const { error, next: [current], notice, pending, likeStreak } = useQueue(kind);

	const skipping = useIsMutating({ mutationKey: ["skip-prospect"] }) > 0;
	const queueing = useIsMutating({ mutationKey: queueKey(kind) }) > 0;
	const queueingAnyMode = useIsMutating({ mutationKey: ["queue"] }) > 0;
	const fetchingQueue = useIsFetching({ queryKey: queueKey(kind) }) > 0;

	// A profile carried over from the other mode, shown here even if it isn't
	// part of this queue. Switching modes reuses this component (no remount), so
	// we re-derive the guest whenever the kind prop changes rather than on mount.
	// Nothing carries over from a mode whose limits are spent.
	const guestFor = (mode: ProspectKind) =>
		displayedProfile
		&& displayedProfile.mode !== mode
		&& !limitsReached(displayedProfile.mode)
			? displayedProfile.userId
			: null;

	const [guest, setGuest] = useState<string | null>(() => guestFor(kind));

	const renderedKind = useRef(kind);
	if (renderedKind.current !== kind) {
		renderedKind.current = kind;
		setGuest(guestFor(kind));
	}

	// Once a guest profile is acted on, fall back to this mode's own queue.
	useEffect(() => {
		if (guest && queueingAnyMode) setGuest(null);
	}, [guest, queueingAnyMode]);

	const displayed = (guest !== current ? guest : null) ?? current;

	useEffect(() => {
		if (displayed) displayedProfile = { userId: displayed, mode: kind };
	}, [displayed, kind]);

	if (error === "finish_profile")
		return <FinishProfileError />;

	if (error === "confirm_email")
		return <ConfirmEmailError />;

	if (!displayed) {
		if (pending) return <ProfileSkeleton />;
		if (skipping || queueing || fetchingQueue) return null;
		return <OutOfProspects mode={kind} />;
	}

	return (
		<>
			<DefaultTour />

			<div className="relative flex w-full max-w-full flex-col items-center gap-4 desktop:w-auto">
				{notice === "fallback" && <FallbackNotice mode={kind} />}
				<StreakNotice streak={likeStreak} />
				<AnimatePresence initial={false}>
					<m.div
						key={displayed}
						animate={{ opacity: 1 }}
						className="relative top-0 z-10 w-full max-w-full desktop:w-auto"
						exit={{ opacity: 0, position: "absolute" }}
						initial={{ opacity: 0 }}
					>
						<CurrentProfile userId={displayed} />
					</m.div>
				</AnimatePresence>
			</div>

			<QueueActions
				explicitUserId={displayed === current ? undefined : displayed}
				kind={kind}
			/>
		</>
	);
};

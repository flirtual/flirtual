import { AnimatePresence, m } from "motion/react";
import type { FC } from "react";

import { Matchmaking, prospectKinds } from "~/api/matchmaking";
import type { ProspectKind } from "~/api/matchmaking";
import { Profile } from "~/components/profile";
import { useDevice } from "~/hooks/use-device";
import { invalidateQueue, useQueue } from "~/hooks/use-queue";
import { useSession } from "~/hooks/use-session";
import { useDefaultTour } from "~/hooks/use-tour";
import { useUser } from "~/hooks/use-user";
import { invalidate, useMutation, userKey } from "~/query";

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
		onSettled: () => prospectKinds.forEach((mode) => void invalidateQueue(mode))
	});

	if (mutation.isIdle) mutation.mutate();
	return null;
};

export const Queue: FC<{ kind: ProspectKind }> = ({ kind }) => {
	const { error, next: [current] } = useQueue(kind);
	// const { error, next: [current, next], previous } = useQueue(kind);

	const currentUser = useUser(current);

	if (error === "finish_profile")
		return <FinishProfileError />;

	if (error === "confirm_email")
		return <ConfirmEmailError />;

	if (!current) return <OutOfProspects mode={kind} />;

	if (!currentUser) return <SkipStaleProspect key={current} userId={current} />;

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
						<Profile userId={current} />
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

"use client";

import { AnimatePresence, motion } from "motion/react";
// eslint-disable-next-line no-restricted-imports
import { useSearchParams } from "next/navigation";
import { type FC, useEffect } from "react";

import { ProspectKind } from "~/api/matchmaking";
import { User } from "~/api/user";
import { Profile } from "~/components/profile/profile";
import { useQueue } from "~/hooks/use-queue";
import { useOptionalSession } from "~/hooks/use-session";
import { userKey } from "~/swr";

import {
	ConfirmEmailError,
	FinishProfileError,
	OutOfProspectsError
} from "./out-of-prospects";
import { QueueActions } from "./queue-actions";

export type QueueAnimationDirection = "backward" | "forward";

export const Queue: FC = () => {
	const session = useOptionalSession();

	const query = useSearchParams();

	let kind = (query.get("kind") as ProspectKind) || "love";
	if (!ProspectKind.includes(kind)) kind = "love";

	const { data: queue } = useQueue(kind);

	useEffect(() => {
		if (!Array.isArray(queue)) return;

		// Optimistically preload the next and previous profiles.
		// TODO:
		// queue.filter(Boolean).forEach((userId) => {
		// 	preload(userKey(userId), ([, userId]) => User.get(userId));
		// });
	}, [queue]);

	if (!session || !queue) return null;

	if ("error" in queue) {
		if (queue.error === "finish_profile") return <FinishProfileError />;
		if (queue.error === "confirm_email") return <ConfirmEmailError />;

		return null;
	}

	const [, current] = queue;

	return (
		<>
			<div className="relative max-w-full gap-4 overflow-hidden">
				{current
					? (
							<AnimatePresence initial={false}>
								<motion.div
									animate={{ opacity: 1 }}
									className="relative top-0 z-10"
									exit={{ opacity: 0, position: "absolute" }}
									initial={{ opacity: 0 }}
									key={current}
								>
									<Profile userId={current} />
								</motion.div>
								{/* {previous && (
									<Suspense key={`${previous}-previous`}>
										<motion.div
											animate={{ opacity: 0 }}
											className="absolute top-0"
											exit={{ opacity: animationDirection === "backward" ? 1 : 0 }}
											initial={{ opacity: 0 }}
										>
											<Profile userId={previous} />
										</motion.div>
									</Suspense>
								)}
								{next && (
									<Suspense key={`${next}-next`}>
										<motion.div
											animate={{ opacity: 0 }}
											className="absolute top-0"
											exit={{ opacity: animationDirection === "forward" ? 1 : 0 }}
											initial={{ opacity: 0 }}
										>
											<Profile userId={next} />
										</motion.div>
									</Suspense>
								)} */}
							</AnimatePresence>
						)
					: (
							<OutOfProspectsError mode={kind} />
						)}
			</div>
			{current && (
				<QueueActions
					key={kind}
					kind={kind}
					queue={queue}
				/>
			)}
		</>
	);
};

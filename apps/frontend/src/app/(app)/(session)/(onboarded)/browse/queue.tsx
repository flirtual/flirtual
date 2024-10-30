"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type FC, Suspense, useState } from "react";

import type { ProspectKind } from "~/api/matchmaking";
import { Profile } from "~/components/profile/profile";
import { useQueue } from "~/hooks/use-queue";
import { useSession } from "~/hooks/use-session";

import {
	ConfirmEmailError,
	FinishProfileError,
	OutOfProspectsError
} from "./out-of-prospects";
import { QueueActions } from "./queue-actions";

export type QueueAnimationDirection = "backward" | "forward";

export const Queue: FC<{ kind: ProspectKind }> = ({ kind }) => {
	const [session] = useSession();
	const { data: queue } = useQueue(kind);
	const [animationDirection, setAnimationDirection]
		= useState<QueueAnimationDirection>("forward");

	if (!session) return null;

	if ("error" in queue) {
		if (queue.error === "finish_profile") return <FinishProfileError />;
		if (queue.error === "confirm_email") return <ConfirmEmailError />;

		return null;
	}

	const [previous, current, next] = queue;

	return (
		<>
			<div className="relative max-w-full gap-4">
				{current
					? (
							<AnimatePresence presenceAffectsLayout initial={false}>
								<Suspense key={current}>
									<motion.div
										animate={{ opacity: 1 }}
										className="relative top-0 z-10"
										exit={{ opacity: 0, position: "absolute" }}
										initial={{ opacity: 0 }}
									>
										<Profile userId={current} />
									</motion.div>
								</Suspense>
								{previous && (
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
								)}
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
					setAnimationDirection={setAnimationDirection}
				/>
			)}
		</>
	);
};

"use client";

import { AnimatePresence, motion } from "motion/react";
import { type FC, Suspense } from "react";

import type { ProspectKind } from "~/api/matchmaking";
import { Profile } from "~/components/profile";
import { useQueue } from "~/hooks/use-queue";

import { OutOfProspects } from "./out-of-prospects";
import { QueueActions } from "./queue-actions";

export const Queue: FC<{ kind: ProspectKind }> = ({ kind }) => {
	const { next: [current] } = useQueue(kind);

	return (
		<>
			{current
				? (
						<Suspense>
							<div className="relative max-w-full gap-4 overflow-hidden">
								<AnimatePresence initial={false}>
									<motion.div
										animate={{ opacity: 1 }}
										className="relative top-0 z-10"
										exit={{ opacity: 0, position: "absolute" }}
										initial={{ opacity: 0 }}
										key={current}
									>
										<Profile hideModeratorInfo userId={current} />
									</motion.div>
								</AnimatePresence>
							</div>
						</Suspense>
					)
				: <OutOfProspects mode={kind} />}
			<QueueActions kind={kind} />
		</>
	);
};

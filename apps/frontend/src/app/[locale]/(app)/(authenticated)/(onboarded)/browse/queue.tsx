"use client";

import { AnimatePresence, motion } from "motion/react";
// eslint-disable-next-line no-restricted-imports
import { useSearchParams } from "next/navigation";
import { type FC, useEffect } from "react";

import { ProspectKind } from "~/api/matchmaking";
import { User } from "~/api/user";
import { Profile } from "~/components/profile";
import { useQueue } from "~/hooks/use-queue";
import { useOptionalSession, useSession } from "~/hooks/use-session";
import { userKey } from "~/query";

import {
	ConfirmEmailError,
	FinishProfileError,
	OutOfProspects
} from "./out-of-prospects";
import { QueueActions } from "./queue-actions";

export type QueueAnimationDirection = "backward" | "forward";

export const Queue: FC = () => {
	let kind = (useSearchParams().get("kind") as ProspectKind) || "love";
	if (!ProspectKind.includes(kind)) kind = "love";

	const { next: [current] } = useQueue(kind);

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
							</AnimatePresence>
						)
					: (
							<OutOfProspects mode={kind} />
						)}
			</div>
			{current && (
				<QueueActions
					explicitUserId={current}
					key={kind}
					kind={kind}
				/>
			)}
		</>
	);
};

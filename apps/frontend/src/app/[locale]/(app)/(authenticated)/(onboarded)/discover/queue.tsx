import { AnimatePresence, m } from "motion/react";
import { Suspense } from "react";
import type { FC } from "react";

import type { ProspectKind } from "~/api/matchmaking";
import { Profile } from "~/components/profile";
import { useQueue } from "~/hooks/use-queue";

import { ConfirmEmailError, FinishProfileError, OutOfProspects } from "./out-of-prospects";
import { QueueActions } from "./queue-actions";

export const Queue: FC<{ kind: ProspectKind }> = ({ kind }) => {
	const { error, next: [current] } = useQueue(kind);
	// const { error, next: [current, next], previous } = useQueue(kind);

	if (error === "finish_profile")
		return <FinishProfileError />;

	if (error === "confirm_email")
		return <ConfirmEmailError />;

	return (
		<>
			{current
				? (
						<Suspense>
							<div className="relative max-w-full gap-4 overflow-hidden">
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
						</Suspense>
					)
				: <OutOfProspects mode={kind} />}

			{/* <Suspense>
				<div
					className="relative top-0 z-10 grid grid-cols-3 gap-4"
				>
					{previous ? <Profile userId={previous} /> : <div />}
					{current ? <Profile userId={current} /> : <div />}
					{next ? <Profile userId={next} /> : <div />}
				</div>
			</Suspense> */}
			<QueueActions kind={kind} />
		</>
	);
};

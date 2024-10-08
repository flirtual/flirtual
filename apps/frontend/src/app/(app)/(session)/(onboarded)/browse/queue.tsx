"use client";

import * as ReactDOM from "react-dom";
import { preload } from "swr";
import { Suspense, useEffect, type FC } from "react";

import { Profile } from "~/components/profile/profile";
import { useQueue } from "~/hooks/use-queue";
import { useSession } from "~/hooks/use-session";
import { Button } from "~/components/button";
import { displayName, User } from "~/api/user";
import { userFetcher, userKey } from "~/hooks/use-user";
import { apiUrl } from "~/const";
import { urls } from "~/urls";

import {
	ConfirmEmailError,
	FinishProfileError,
	OutOfProspectsError
} from "./out-of-prospects";
import { ProspectActions } from "./prospect-actions";

import type { ProspectKind } from "~/api/matchmaking";

export const Queue: FC<{ kind: ProspectKind }> = ({ kind }) => {
	const [session] = useSession();
	const { data: queue } = useQueue(kind);

	if (!session) return null;

	if ("error" in queue) {
		if (queue.error === "finish_profile") return <FinishProfileError />;
		if (queue.error === "confirm_email") return <ConfirmEmailError />;

		return null;
	}

	const [previous, current, next] = queue;
	if (!current) return <OutOfProspectsError mode={kind} />;

	useEffect(() => {
		void (previous && preload(userKey(previous), userFetcher));
		void (next && preload(userKey(next), userFetcher));
	}, [previous, next]);

	return (
		<>
			<div className="relative max-w-full gap-4">
				{/* {previous && (
					<Suspense fallback="previous?">
						previous
						<Profile userId={previous} />
					</Suspense>
				)} */}
				{next && (
					<Suspense>
						<Profile
							className="absolute -right-48 top-16 isolate max-h-[64rem] origin-top rotate-12 scale-90 blur"
							userId={next}
						/>
					</Suspense>
				)}
				<Profile className="isolate z-10" userId={current} />
			</div>
			<ProspectActions key={kind} kind={kind} userId={current} />
		</>
	);
};

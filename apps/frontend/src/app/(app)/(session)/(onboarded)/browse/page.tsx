"use client";

import { redirect } from "next/navigation";
import useSWR from "swr";
import ms from "ms";

import { Matchmaking, ProspectKind } from "~/api/matchmaking";
import { urls } from "~/urls";
import { Profile } from "~/components/profile/profile";
import { useQueue } from "~/hooks/use-queue";

import {
	ConfirmEmailError,
	FinishProfileError,
	OutOfProspectsError
} from "./out-of-prospects";
import { ProspectActions } from "./prospect-actions";

interface BrowsePageProps {
	searchParams: { kind?: string };
}

// export async function generateMetadata({ searchParams }: BrowsePageProps) {
// 	const kind = (searchParams.kind ?? "love") as ProspectKind;
// 	return {
// 		title: kind === "friend" ? "Homie Mode" : "Browse"
// 	};
// }

export default function BrowsePage({ searchParams }: BrowsePageProps) {
	const kind = (searchParams.kind ?? "love") as ProspectKind;
	if (!ProspectKind.includes(kind)) return redirect(urls.browse());

	const { data: queue } = useQueue(kind);

	if ("error" in queue) {
		if (queue.error === "finish_profile") return <FinishProfileError />;
		if (queue.error === "confirm_email") return <ConfirmEmailError />;

		return;
	}

	const {
		prospects: [currentId, nextId],
		likesLeft: _likesLeft,
		passesLeft: _passesLeft
	} = queue;

	const likesLeft = !!nextId && _likesLeft > 0;
	const passesLeft = !!nextId && _passesLeft > 0;

	if (!currentId) return <OutOfProspectsError mode={kind} />;

	return (
		<>
			<div className="relative max-w-full" key={currentId}>
				<Profile id="current-profile" userId={currentId} />
				{nextId && (
					<Profile
						className="absolute hidden"
						id="next-profile"
						userId={nextId}
					/>
				)}
			</div>
			<ProspectActions
				kind={kind}
				likesLeft={likesLeft}
				passesLeft={passesLeft}
				userId={currentId}
			/>
		</>
	);

	return (
		<>
			{current ? (
				<>
					<div className="relative max-w-full">
						<Profile
							className=""
							id="current-profile"
							key={current.id}
							user={current}
						/>
						{next && (
							<Profile
								className="absolute hidden"
								id="next-profile"
								key={current.id + 1}
								user={next}
							/>
						)}
					</div>
					<ProspectActions
						kind={kind}
						likesLeft={likesLeft}
						passesLeft={passesLeft}
						prospect={current}
					/>
				</>
			) : (
				<OutOfProspectsError mode={kind} />
			)}
		</>
	);
}

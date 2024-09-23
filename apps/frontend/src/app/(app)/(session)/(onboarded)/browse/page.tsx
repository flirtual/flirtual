import { redirect } from "next/navigation";

import { Matchmaking, ProspectKind } from "~/api/matchmaking";
import { urls } from "~/urls";
import { Profile } from "~/components/profile/profile";
import { User } from "~/api/user";

import {
	ConfirmEmailError,
	FinishProfileError,
	OutOfProspectsError
} from "./out-of-prospects";
import { ProspectActions } from "./prospect-actions";

interface BrowsePageProps {
	searchParams: { kind?: string };
}

export async function generateMetadata({ searchParams }: BrowsePageProps) {
	const kind = (searchParams.kind ?? "love") as ProspectKind;
	return {
		title: kind === "friend" ? "Homie Mode" : "Browse"
	};
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
	const kind = (searchParams.kind ?? "love") as ProspectKind;
	if (!ProspectKind.includes(kind)) return redirect(urls.browse());

	const queue = await Matchmaking.queue(kind);
	if ("error" in queue) {
		if (queue.error === "finish_profile") return <FinishProfileError />;
		if (queue.error === "confirm_email") return <ConfirmEmailError />;

		return;
	}

	const {
		prospects: prospectIds,
		likesLeft: _likesLeft,
		passesLeft: _passesLeft
	} = queue;

	const users = await User.getMany(prospectIds);
	const [current, next] = users;

	const likesLeft = users.length > 1 && _likesLeft > 0;
	const passesLeft = users.length > 1 && _passesLeft > 0;

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

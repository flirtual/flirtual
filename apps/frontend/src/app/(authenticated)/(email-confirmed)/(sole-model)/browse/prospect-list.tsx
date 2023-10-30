"use client";

import { FC } from "react";

import { ProspectKind } from "~/api/matchmaking";
import { User } from "~/api/user";
import { Profile } from "~/components/profile/profile";
import { useSession } from "~/hooks/use-session";

import { OutOfProspects } from "./out-of-prospects";
import { DebuggerActions } from "./debugger-actions";
import { ProspectActions } from "./prospect-actions";

export interface ProspectListProps {
	current: User;
	next: User;
	kind: ProspectKind;
	likesLeft?: boolean;
	passesLeft?: boolean;
}

export const ProspectList: FC<ProspectListProps> = ({
	kind,
	current,
	next,
	likesLeft,
	passesLeft
}) => {
	const [session] = useSession();

	if (!session) return null;

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
				<OutOfProspects mode={kind} />
			)}
			<DebuggerActions session={session} />
		</>
	);
};

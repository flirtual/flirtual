import { ProspectKind } from "~/api/matchmaking";
import { User } from "~/api/user";
import { Profile } from "~/components/profile/profile";
import { withSession } from "~/server-utilities";

import { DebuggerActions } from "./debugger-actions";
import { ProspectActionBar } from "./prospect-actions";
import { OutOfProspects } from "./out-of-prospects";

export interface ProspectListProps {
	prospects: Array<User>;
	kind: ProspectKind;
}

export async function ProspectList({ kind, prospects }: ProspectListProps) {
	const session = await withSession();
	const prospect = prospects[0];

	return (
		<>
			{prospect ? (
				<>
					<Profile key={prospect.id} user={prospect} />
					<ProspectActionBar mode={kind} userId={prospect.id} />
				</>
			) : (
				<OutOfProspects mode={kind} user={session.user} />
			)}
			<DebuggerActions session={session} />
		</>
	);
}

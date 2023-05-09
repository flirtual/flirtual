import { ProspectKind } from "~/api/matchmaking";
import { User } from "~/api/user";
import { Profile } from "~/components/profile/profile";
import { withSession } from "~/server-utilities";

import { OutOfProspects } from "./out-of-prospects";
import { ProspectActionBar } from "./prospect-actions";
import { DebuggerActions } from "./debugger-actions";

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
					{/* @ts-expect-error: Server Component */}
					<Profile hideRelationActions key={prospect.id} user={prospect} />
					<ProspectActionBar mode={kind} userId={prospect.id} />
				</>
			) : (
				<OutOfProspects mode={kind} user={session.user} />
			)}
			<DebuggerActions session={session} />
		</>
	);
}

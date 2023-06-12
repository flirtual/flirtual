import { User, displayName } from "~/api/user";

import { ModelCard } from "../model-card";

import { BlockedActions } from "./blocked-actions";

export const BlockedProfile: React.FC<{ user: User }> = ({ user }) => {
	return (
		<ModelCard
			title="Account blocked"
			containerProps={{
				className: "gap-8"
			}}
		>
			<span>
				You&apos;ve blocked{" "}
				<span className="font-semibold">{displayName(user)}</span>, so you
				can&apos;t see their profile, and they can&apos;t see yours either.
			</span>
			<BlockedActions user={user} />
		</ModelCard>
	);
};

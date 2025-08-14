import type { FC } from "react";
import { useSearchParams } from "react-router";

import { Profile } from "~/components/profile";
import { useRelationship, useUser } from "~/hooks/use-user";

import { QueueActions } from "../discover/queue-actions";

const ProfileQueueActions: FC<{ userId: string }> = ({ userId }) => {
	const user = useUser(userId);
	const relationship = useRelationship(userId);

	if (!user
		|| user.bannedAt
		|| !relationship
		|| relationship?.blocked
		|| relationship?.kind) return;

	return (
		<QueueActions
			// explicitUserId={userId}
			kind="love"
		/>
	);
};

export default function ProfilePage() {
	const [searchParameters] = useSearchParams();
	const userId = searchParameters.get("userId");
	if (!userId) return null;

	return (
		<>
			<Profile direct userId={userId} />
			<ProfileQueueActions userId={userId} />
		</>
	);
}

import type { FC } from "react";

import { Profile } from "~/components/profile";
import { useRelationship, useUser } from "~/hooks/use-user";
import { notFound, useSearchParams } from "~/i18n/navigation";

import { QueueActions } from "../discover/[group]/queue-actions";

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
	const userId = useSearchParams().get("");
	if (!userId) notFound();

	return (
		<>
			<Profile direct userId={userId} />
			<ProfileQueueActions userId={userId} />
		</>
	);
}

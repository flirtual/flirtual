import { Suspense } from "react";
import type { FC } from "react";
import { useParams } from "react-router";

import { preloadProfileAttributes, Profile } from "~/components/profile";
import { useRelationship, useUser } from "~/hooks/use-user";

import { QueueActions } from "../discover/queue-actions";

export const handle = {
	preload: preloadProfileAttributes
};

export const clientLoader = handle.preload;

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
	const { slug } = useParams();

	const user = useUser(slug!);
	// TODO: Handle user not found case properly
	if (!user) return null;

	return (
		<>
			<Profile direct userId={user.id} />
			<Suspense>
				<ProfileQueueActions userId={user.id} />
			</Suspense>
		</>
	);
}

"use client";

import { type FC, Suspense, use } from "react";

import { Profile } from "~/components/profile/profile";
import { useRelationship, useUser } from "~/hooks/use-user";

import { QueueActions } from "../browse/queue-actions";
import type { ProfilePageProps } from "./layout";

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
			explicitUserId={userId}
			kind="love"
		/>
	);
};

export default function ProfilePage({ params }: ProfilePageProps) {
	const { slug } = use(params);

	const user = useUser(slug);
	if (!user) return null; // redirect(urls.default);

	return (
		<>
			<Profile direct userId={user.id} />
			<Suspense>
				<ProfileQueueActions userId={user.id} />
			</Suspense>
		</>
	);
}

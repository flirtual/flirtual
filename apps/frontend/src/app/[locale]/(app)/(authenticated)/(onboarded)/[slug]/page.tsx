import { Suspense, use } from "react";
import type { FC } from "react";

import { Profile } from "~/components/profile";
import { useRelationship, useUser } from "~/hooks/use-user";
import { notFound } from "~/i18n/navigation";

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
			explicitUserId={userId}
			kind="love"
		/>
	);
};

export const dynamic = "force-dynamic";

export default function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = use(params);

	const user = useUser(slug);
	if (!user) return notFound();

	return (
		<>
			<Profile direct userId={user.id} />
			<Suspense>
				<ProfileQueueActions userId={user.id} />
			</Suspense>
		</>
	);
}

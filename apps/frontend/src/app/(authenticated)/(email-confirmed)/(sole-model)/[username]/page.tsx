import { Metadata } from "next";

import { displayName } from "~/api/user";
import { Profile } from "~/components/profile/profile";

import { ProspectActionBar } from "../browse/prospect-actions";

import { getProfileUser } from "./profile-user";

export interface ProfilePageProps {
	params: { username: string };
}

export async function generateMetadata({
	params
}: ProfilePageProps): Promise<Metadata> {
	const user = await getProfileUser(params.username);

	return {
		title: displayName(user)
	};
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	const user = await getProfileUser(params.username);

	return (
		<>
			<Profile direct user={user} />
			{!user.bannedAt &&
				user.relationship &&
				!user.relationship?.blocked &&
				!user.relationship?.kind && (
					<ProspectActionBar mode="love" userId={user.id} />
				)}
		</>
	);
}

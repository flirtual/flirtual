import { displayName } from "~/api/user";
import { Profile } from "~/components/profile/profile";
import { ProspectActions } from "~/app/(app)/(session)/(onboarded)/browse/prospect-actions";

import { getProfile } from "../data";

import type { Metadata } from "next";

export interface ProfilePageProps {
	params: { slug: string };
}

export async function generateMetadata({
	params
}: ProfilePageProps): Promise<Metadata> {
	const user = await getProfile(params.slug);

	return {
		title: displayName(user)
	};
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	const user = await getProfile(params.slug);

	return (
		<>
			<Profile direct user={user} />
			{!user.bannedAt &&
				user.relationship &&
				!user.relationship?.blocked &&
				!user.relationship?.kind && (
					<ProspectActions kind="love" prospect={user} />
				)}
		</>
	);
}

import { notFound } from "next/navigation";

import { api } from "~/api";
import { Profile } from "~/components/profile/profile";
import { thruServerCookies } from "~/server-utilities";

export interface ProfilePageProps {
	params: { username: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	const user = await api.user
		.getByUsername(params.username, thruServerCookies())
		.catch(() => notFound());

	return <Profile user={user} />;
}

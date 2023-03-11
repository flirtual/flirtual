import { notFound, redirect } from "next/navigation";

import { api } from "~/api";
import { Profile } from "~/components/profile/profile";
import { thruServerCookies } from "~/server-utilities";
import { urls } from "~/urls";

export interface ProfilePageProps {
	params: { username: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	const user =
		params.username === "me"
			? await api.auth.user(thruServerCookies()).catch(() => redirect(urls.login()))
			: await api.user.getByUsername(params.username, thruServerCookies()).catch(() => notFound());

	return <Profile user={user} />;
}

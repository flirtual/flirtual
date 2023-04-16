import { redirect } from "next/navigation";

import { api } from "~/api";
import { Profile } from "~/components/profile/profile";
import { thruServerCookies, withSession } from "~/server-utilities";
import { urls } from "~/urls";

export interface ProfilePageProps {
	params: { username: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	const session = await withSession();

	const user =
		params.username === "me"
			? session.user
			: await api.user
					.getByUsername(params.username, thruServerCookies())
					.catch(() => redirect(urls.default));

	return <Profile user={user} />;
}

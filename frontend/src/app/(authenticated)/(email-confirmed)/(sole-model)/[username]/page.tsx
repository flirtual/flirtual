import { Metadata } from "next";
import { redirect } from "next/navigation";
// eslint-disable-next-line import/named
import { cache } from "react";

import { api } from "~/api";
import { displayName } from "~/api/user";
import { Profile } from "~/components/profile/profile";
import { thruServerCookies, withSession } from "~/server-utilities";
import { urls } from "~/urls";

export interface ProfilePageProps {
	params: { username: string };
}

export const getProfileUser = cache(async (username: string) => {
	return username === "me"
		? (await withSession()).user
		: await api.user
				.getByUsername(username, thruServerCookies())
				.catch(() => redirect(urls.default));
});

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
	const user = await getProfileUser(params.username);

	return {
		title: displayName(user)
	};
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	const user = await getProfileUser(params.username);

	// @ts-expect-error: Server Component
	return <Profile user={user} />;
}

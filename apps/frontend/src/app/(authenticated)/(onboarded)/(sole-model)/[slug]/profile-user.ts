import { redirect } from "next/navigation";
import { cache } from "react";

import { api } from "~/api";
import { thruServerCookies, withSession } from "~/server-utilities";
import { urls } from "~/urls";
import { isUid } from "~/utilities";

export const getProfileUser = cache(async (username: string) => {
	const session = await withSession();

	if (username === "me") redirect(session.user.slug);

	if (username === session.user.slug) {
		if (session.user.status === "onboarded") return redirect(urls.finish(1));
		return session.user;
	}

	if (isUid(username))
		return api.user
			.get(username, thruServerCookies())
			.catch(() => redirect(urls.default));

	return api.user
		.getBySlug(username.slice(0, 20), thruServerCookies())
		.catch(() => redirect(urls.default));
});

import { redirect } from "next/navigation";
import { cache } from "react";

import { api } from "~/api";
import { thruServerCookies, withSession } from "~/server-utilities";
import { urls } from "~/urls";
import { isUid } from "~/utilities";

export const getProfileUser = cache(async (username: string) => {
	const session = await withSession();

	if (username === "me") redirect(session.user.username);

	if (isUid(username))
		return await api.user
			.get(username, thruServerCookies())
			.catch(() => redirect(urls.default));

	return username === "me"
		? session.user
		: await api.user
				.getByUsername(username, thruServerCookies())
				.catch(() => redirect(urls.default));
});

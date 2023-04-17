import { redirect } from "next/navigation";
// eslint-disable-next-line import/named
import { cache } from "react";

import { api } from "~/api";
import { thruServerCookies, withSession } from "~/server-utilities";
import { urls } from "~/urls";
import { isUuid } from "~/utilities";

export const getProfileUser = cache(async (username: string) => {
	const session = await withSession();

	if (session.user.id === username || session.user.username === username) redirect(urls.user.me);

	if (isUuid(username))
		return await api.user.get(username, thruServerCookies()).catch(() => redirect(urls.default));

	return username === "me"
		? session.user
		: await api.user
				.getByUsername(username, thruServerCookies())
				.catch(() => redirect(urls.default));
});

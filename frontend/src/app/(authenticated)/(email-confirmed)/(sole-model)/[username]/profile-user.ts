import { redirect } from "next/navigation";
// eslint-disable-next-line import/named
import { cache } from "react";

import { api } from "~/api";
import { thruServerCookies, withSession } from "~/server-utilities";
import { urls } from "~/urls";

export const getProfileUser = cache(async (username: string) => {
	return username === "me"
		? (await withSession()).user
		: await api.user
				.getByUsername(username, thruServerCookies())
				.catch(() => redirect(urls.default));
});

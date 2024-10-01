import { redirect } from "next/navigation";
import { cache } from "react";

import { Authentication } from "~/api/auth";
import { User } from "~/api/user";
import { urls } from "~/urls";
import { isUid } from "~/utilities";

export const getProfile = cache(async (username: string) => {
	const session = await Authentication.getSession();

	if (username === "me") redirect(session.user.slug);

	if (username === session.user.slug) {
		if (session.user.status === "onboarded") return redirect(urls.finish(1));
		return session.user;
	}

	const user = isUid(username)
		? await User.get(username)
		: await User.getBySlug(username);

	if (!user) redirect(urls.default);
	return user;
});

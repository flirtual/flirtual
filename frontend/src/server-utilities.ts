import "server-only";

// eslint-disable-next-line import/named
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api, ResponseError } from "./api";
import { urls } from "./urls";
import { UserTags } from "./api/user";

export function thruServerCookies() {
	return {
		headers: {
			cookie: cookies()
				.getAll()
				.map(({ name, value }) => `${name}=${value}`)
				.join("; ")
		},
		cache: "no-store" as const
	};
}

export const withOptionalSession = cache(async () => {
	console.debug("withOptionalSession");
	return await api.auth.session(thruServerCookies()).catch((reason) => {
		if (!(reason instanceof ResponseError)) throw reason;
		if (reason.statusCode === 401) return null;
		throw reason;
	});
});

export const withSession = cache(async (to: string = urls.login()) => {
	console.debug("withSession", to);
	const session = await withOptionalSession();

	if (!session) return redirect(to);
	return session;
});

export const withVisibleUser = cache(async () => {
	console.debug("withVisibleUser");
	const { user } = await withSession();

	if (!user.visible) {
		const { visible, reasons } = await api.user
			.visible(user.id, thruServerCookies())
			.catch(() => ({ visible: false, reasons: [] }));

		if (!visible) {
			const reason = reasons[0];
			if (reason && reason.to) return redirect(reason.to);
		}
	}

	return user;
});

export const withTaggedUser = cache(async (...tags: Array<UserTags>) => {
	console.debug("withTaggedUser", tags);
	const { user } = await withSession();

	if (!tags.every((tag) => user.tags?.includes(tag))) {
		redirect(urls.default);
	}

	return user;
});

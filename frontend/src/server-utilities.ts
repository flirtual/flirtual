import "server-only";

// eslint-disable-next-line import/named
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { api, ResponseError } from "./api";
import { toAbsoluteUrl, toRelativeUrl, urls } from "./urls";
import { UserTags } from "./api/user";
import { tryJsonParse } from "./utilities";

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
	return await api.auth.session(thruServerCookies()).catch((reason) => {
		if (!(reason instanceof ResponseError)) throw reason;
		if (reason.statusCode === 401) return null;
		throw reason;
	});
});

export const withSession = cache(async (next?: string) => {
	const session = await withOptionalSession();
	next ??= toRelativeUrl(await withLocation());

	if (!session) return redirect(urls.login(next));
	return session;
});

export const withVisibleUser = cache(async () => {
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
	const { user } = await withSession();

	if (!tags.every((tag) => user.tags?.includes(tag))) {
		redirect(urls.default);
	}

	return user;
});

/**
 * This is a hack to get the current location from the server
 * It's not perfect, but it's the best we can do with Next.js currently.
 *
 * Known issues:
 * - This may return the location of the last request, not the current request,
 * since Next.js doesn't refetch on client navigation.
 */
export const withLocation = cache(async () => {
	const pathname = headers().get("x-invoke-path") ?? "/";

	const query = tryJsonParse(decodeURIComponent(headers().get("x-invoke-query") ?? "{}"), {});
	const queryString = new URLSearchParams(query).toString();

	return toAbsoluteUrl(`${pathname}${Object.keys(query).length ? `?${queryString}` : ""}`);
});

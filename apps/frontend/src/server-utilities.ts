import "server-only";

import * as Sentry from "@sentry/nextjs";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { api, ResponseError } from "./api";
import { toAbsoluteUrl, urls } from "./urls";
import { tryJsonParse } from "./utilities";

import type { UserTags } from "./api/user";

export function thruServerCookies() {
	return {
		headers: {
			cookie: cookies().toString()
		},
		cache: "no-store" as const
	};
}

export const withOptionalSession = cache(async () => {
	const session = await api.auth
		.session(thruServerCookies())
		.catch((reason) => {
			if (!(reason instanceof ResponseError)) throw reason;
			if (reason.statusCode === 401) return null;
			throw reason;
		});

	// Set the user context for Sentry depending on the user's privacy settings.
	Sentry.setUser(
		session?.user.preferences?.privacy.analytics
			? { id: session?.user.id }
			: null
	);

	return session;
});

export const withSession = cache(async (next?: string) => {
	const session = await withOptionalSession();

	if (!session) return redirect(urls.login(next));
	return session;
});

export const withOnboardedUser = cache(async () => {
	const { user } = await withSession();

	if (user.status === "registered") return redirect(urls.onboarding(1));
	if (user.deactivatedAt) return redirect(urls.settings.deactivateAccount);

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

	const query = tryJsonParse(
		decodeURIComponent(headers().get("x-invoke-query") ?? "{}"),
		{}
	);
	const queryString = new URLSearchParams(query).toString();

	return toAbsoluteUrl(
		`${pathname}${Object.keys(query).length > 0 ? `?${queryString}` : ""}`
	);
});

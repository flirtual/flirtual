import "server-only";

import * as Sentry from "@sentry/nextjs";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api, ResponseError } from "./api";
import { urls } from "./urls";

export function thruServerCookies() {
	return {
		headers: {
			cookie: cookies().toString()
		},
		cache: "no-store" as const
	};
}

export const getOptionalSession = cache(async () => {
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

export const getSession = cache(async (next?: string) => {
	const session = await getOptionalSession();

	if (!session) return redirect(urls.login(next));
	return session;
});

export const getOnboardedUser = cache(async () => {
	const { user } = await getSession();

	if (user.status === "registered") return redirect(urls.onboarding(1));
	if (user.deactivatedAt) return redirect(urls.settings.deactivateAccount);

	return user;
});

export const assertGuest = cache(async () => {
	const session = await getOptionalSession();
	if (session) return redirect(urls.default);
});

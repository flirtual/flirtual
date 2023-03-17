import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api, ResponseError } from "./api";
import { urls } from "./urls";
import { Session } from "./api/auth";

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

export interface ServerAuthenticateOptions {
	optional?: boolean;
	emailConfirmedOptional?: boolean;
	visibleOptional?: boolean;
}

export async function useServerAuthenticate(
	options?: ServerAuthenticateOptions & { optional?: false }
): Promise<Session>;
export async function useServerAuthenticate(
	options?: ServerAuthenticateOptions & { optional: true }
): Promise<Session | null>;
export async function useServerAuthenticate(
	options: ServerAuthenticateOptions
): Promise<Session | null>;
export async function useServerAuthenticate(
	options: ServerAuthenticateOptions = {}
): Promise<Session | null> {
	const { optional = false, emailConfirmedOptional = false, visibleOptional = false } = options;

	const session = await api.auth.session(thruServerCookies()).catch((reason) => {
		if (!(reason instanceof ResponseError)) throw reason;
		if (reason.statusCode === 401) return null;
		throw reason;
	});

	if (!session && !optional) redirect(urls.login());

	if (session) {
		if (!session.user.visible) {
			const { visible, reasons } = await api.user
				.visible(session.user.id, thruServerCookies())
				.catch(() => ({ visible: false, reasons: [] }));

			if (!visible) {
				const reason = reasons[0];
				if (reason && !(optional || visibleOptional)) {
					if (reason.to) redirect(reason.to);
				}
			}
		}
	}

	// if the user's email is not confirmed, and we don't allow email to be optionally verified.
	if (!session?.user?.emailConfirmedAt && !(optional || emailConfirmedOptional))
		return redirect(urls.confirmEmail());

	return session;
}

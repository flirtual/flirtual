import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api, ResponseError } from "./api";
import { User } from "./api/user/user";
import { urls } from "./urls";

export function thruServerCookies() {
	return {
		headers: {
			cookie: cookies()
				.getAll()
				.map(({ name, value }) => `${name}=${value}`)
				.join("; ")
		}
	};
}

export interface ServerAuthenticateOptions {
	optional?: boolean;
	emailConfirmedOptional?: boolean;
	visibleOptional?: boolean;
}

export async function useServerAuthenticate(
	options?: ServerAuthenticateOptions & { optional?: false }
): Promise<User>;
export async function useServerAuthenticate(
	options?: ServerAuthenticateOptions & { optional: true }
): Promise<User | null>;
export async function useServerAuthenticate(
	options: ServerAuthenticateOptions
): Promise<User | null>;
export async function useServerAuthenticate(
	options: ServerAuthenticateOptions = {}
): Promise<User | null> {
	const { optional = false, emailConfirmedOptional = false, visibleOptional = false } = options;

	const user = await api.auth
		.user({ ...thruServerCookies(), cache: "no-cache" })
		.catch((reason) => {
			if (!(reason instanceof ResponseError)) throw reason;
			if (reason.statusCode === 401) return null;
			throw reason;
		});

	if (!user && !optional) redirect(urls.login());

	if (user) {
		const { visible, reasons } = await api.user.visible(user.id, {
			...thruServerCookies(),
			cache: "no-cache"
		});

		const reason = reasons[0];
		if (reason && !(optional || visibleOptional)) {
			if (!visible && reason.to) redirect(reason.to);
		}
	}

	// if the user's email is not confirmed, and we don't allow email to be optionally verified.
	if (!user?.emailConfirmedAt && !(optional || emailConfirmedOptional))
		return redirect(urls.confirmEmail());

	return user;
}

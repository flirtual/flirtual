import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api } from "./api";
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
	to?: string;
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
	const { optional = false, to = urls.login() } = options;
	const user = await api.auth.user({ ...thruServerCookies(), cache: "no-store" }).catch(() => null);

	if (!user && !optional) return redirect(to);
	return user;
}

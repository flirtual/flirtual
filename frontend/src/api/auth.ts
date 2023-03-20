import { DatedModel } from "./common";
import { User } from "./user";
import { fetch, NarrowFetchOptions } from "./exports";

export type Session = DatedModel & {
	sudoerId?: string;
	user: User;
};

export async function login(
	options: NarrowFetchOptions<{
		email: string;
		password: string;
		rememberMe: boolean;
	}>
) {
	return fetch<Session>("post", "auth/session", options);
}

export async function logout(options: NarrowFetchOptions = {}) {
	return fetch("delete", "auth/session", { ...options, raw: true });
}

export async function sudo(options: NarrowFetchOptions<{ userId: string }>) {
	return fetch<Session>("post", "auth/sudo", options);
}

export async function revokeSudo(options: NarrowFetchOptions = {}) {
	return fetch<Session>("delete", "auth/sudo", options);
}

export async function session(options: NarrowFetchOptions = {}) {
	return fetch<Session>("get", "auth/session", options);
}

export async function user(options: NarrowFetchOptions = {}) {
	return fetch<User>("get", "auth/user", options);
}

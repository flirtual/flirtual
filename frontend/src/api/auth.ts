import { User } from "./user/user";
import { DatedModel } from "./common";

import { fetch, FetchOptions } from ".";

export type Session = DatedModel & {
	userId: string;
};

export interface LoginOptions {
	email: string;
	password: string;
	rememberMe: boolean;
}

export async function login(body: LoginOptions, options: FetchOptions = {}) {
	return fetch<Session>("post", "auth/session", { ...options, body });
}

export async function logout(options: FetchOptions = {}) {
	await fetch("delete", "auth/session", { ...options, raw: true });
}

export async function session(options: FetchOptions = {}) {
	await fetch<Session>("get", "auth/session", options);
}

export async function user(options: FetchOptions = {}) {
	return fetch<User>("get", "auth/user", options);
}

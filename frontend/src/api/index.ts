/* eslint-disable @typescript-eslint/no-explicit-any */
import { toCamelObject, toSnakeObject } from "~/utilities";

export const baseUrl = process.env["NEXT_PUBLIC_API_URL"] as string;

export function newUrl(pathname: string, query: Record<string, string> = {}): URL {
	const searchParams = new URLSearchParams(query);
	searchParams.sort();

	return new URL(
		`${pathname}${Object.keys(query).length > 0 ? `?${searchParams.toString()}` : ""}`,
		baseUrl
	);
}

export type FetchOptions = Omit<RequestInit, "method" | "body"> & {
	query?: Record<string, string>;
	body?: any;
	raw?: boolean;
};
export type FetchMethod = "get" | "post" | "delete" | "patch" | "put";

export async function fetch<T = unknown>(
	method: FetchMethod,
	pathname: string,
	options?: FetchOptions & { raw?: false }
): Promise<T>;
export async function fetch(
	method: FetchMethod,
	pathname: string,
	options: FetchOptions & { raw: true }
): Promise<Response>;
export async function fetch<T = unknown>(
	method: FetchMethod,
	pathname: string,
	options?: FetchOptions
): Promise<T>;
export async function fetch<T = unknown>(
	method: FetchMethod,
	pathname: string,
	options: FetchOptions = {}
): Promise<T | Response> {
	const url = newUrl(pathname, options.query);
	const body = options.raw
		? options.body
		: JSON.stringify(typeof options.body === "object" ? toSnakeObject(options.body) : options.body);

	const response = await globalThis.fetch(url, {
		...options,
		credentials: "include",
		headers: {
			"content-type": "application/json",
			...options.headers
		},
		method,
		body
	});

	if (options.raw) return response;
	const responseBody = toCamelObject<any>(await response.json());

	if (!response.ok || "error" in responseBody) {
		const error = Object.assign(
			new Error("Request error"),
			responseBody?.error || { message: "Unknown error" }
		);
		error.stack = error.stack.split("\n").slice(2).join("\n");

		throw error;
	}

	return responseBody;
}

export * as auth from "./auth";
export * as profile from "./profile";
export * as user from "./user";
export * as api from "./";

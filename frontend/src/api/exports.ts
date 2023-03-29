/* eslint-disable @typescript-eslint/no-explicit-any */
import { urls } from "~/urls";
import { entries, Expand, fromEntries, toCamelObject, toSnakeObject } from "~/utilities";

export function newUrl(pathname: string, query: Record<string, string | undefined> = {}): URL {
	const searchParams = new URLSearchParams(
		fromEntries(
			entries(toSnakeObject(query) as Record<string, string | undefined>).filter(([, v]) =>
				Boolean(v)
			)
		) as Record<string, string>
	);
	searchParams.sort();

	return new URL(
		`${pathname}${Object.keys(query).length > 0 ? `?${searchParams.toString()}` : ""}`,
		urls.api
	);
}

export class ResponseError extends Error {
	public statusCode: number;
	public constructor(private response: Response, public body: any) {
		const message = body?.error.message || response.statusText;
		super(message);

		this.statusCode = this.response.status;
	}
}

export class ResponseChangesetError extends ResponseError {
	public properties: Record<string, Array<string>>;
	public constructor(response: Response, body: any) {
		super(response, body);
		this.properties = body?.error?.properties ?? {};
	}
}

export type FetchOptions = Expand<
	Omit<RequestInit, "method" | "body"> & {
		query?: unknown;
		body?: unknown;
		raw?: boolean;
	}
>;

export type NarrowFetchOptions<Body = undefined, Query = undefined> = Expand<
	Omit<FetchOptions, "body" | "query"> &
		(Body extends undefined ? { body?: undefined } : { body: Expand<Body> }) &
		(Query extends undefined ? { query?: undefined } : { query: Expand<Query> })
>;

export type FetchMethod = "get" | "post" | "delete" | "patch" | "put";

export async function fetch<T = unknown, O extends FetchOptions = FetchOptions>(
	method: FetchMethod,
	pathname: string,
	options?: O & { raw?: false }
): Promise<T>;
export async function fetch(
	method: FetchMethod,
	pathname: string,
	options: FetchOptions & { raw: true }
): Promise<Response>;
export async function fetch<T = unknown, O extends FetchOptions = FetchOptions>(
	method: FetchMethod,
	pathname: string,
	options?: O
): Promise<T>;
export async function fetch<T = unknown, O extends FetchOptions = FetchOptions>(
	method: FetchMethod,
	pathname: string,
	options: O
): Promise<T | Response> {
	const url = newUrl(pathname, options.query as Record<string, string | undefined>);
	const body: any = options.raw
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
		const error = new (responseBody?.error.properties ? ResponseChangesetError : ResponseError)(
			response,
			responseBody
		);
		error.stack = error.stack?.split("\n").slice(2).join("\n");

		throw error;
	}

	return responseBody;
}

export * as attributes from "./attributes";
export * as auth from "./auth";
export * as conversations from "./conversations";
export * as debug from "./debug";
export * as user from "./user";
export * as file from "./file";
export * as matchmaking from "./matchmaking";
export * as report from "./report";
export * as subscription from "./subscription";

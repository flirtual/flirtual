import wretch, { type ConfiguredMiddleware } from "wretch";
import QueryAddon from "wretch/addons/queryString";
import AbortAddon from "wretch/addons/abort";
import { retry } from "wretch/middlewares/retry";
import { WretchError } from "wretch/resolver";
import { unstable_noStore } from "next/cache";

import { urls } from "~/urls";
import { newIdempotencyKey, toCamelObject, toSnakeObject } from "~/utilities";

export interface UuidModel {
	id: string;
}

export interface CreatedAtModel {
	createdAt: string;
}

export interface UpdatedAtModel {
	updatedAt: string;
}

export type DatedModel = CreatedAtModel & UpdatedAtModel;

export interface Paginate<T> {
	entries: Array<T>;
	metadata: {
		page: number;
		limit: number;
	};
}

export type PaginateOptions<T> = T & {
	limit?: number;
	page?: number;
};

const releventHeaders = ["cookie", "authorization", "user-agent"];

// All status codes that are retriable by the browser, except 5xx which are always retried.
const retriableStatusCodes = [408, 429];

export const api = wretch(urls.api)
	.addon(QueryAddon)
	.addon(AbortAddon())
	.options({
		credentials: "include"
	})
	.middlewares(
		[
			((next) => {
				return async (url, options) => {
					options.headers ??= {};

					if (
						typeof window === "undefined" &&
						// We can't use `headers` with `unstable_cache` which caches across requests,
						// so when we're using `credentials: "omit"`, we'll exclude the headers.
						options.credentials !== "omit"
					) {
						const { headers } = await import("next/headers");
						const relevantHeaders = Object.fromEntries(
							[...headers().entries()].filter(([key]) =>
								releventHeaders.includes(key)
							)
						);

						unstable_noStore();

						options.headers = {
							...options.headers,
							...relevantHeaders
						};
					}

					const headers = new Headers(options.headers);
					options.headers = headers;

					console.log(options.method, url);
					const response = await next(url, options);

					console.log(options.method, url, response.status);

					return response;
				};
			}) as ConfiguredMiddleware,
			retry({
				delayTimer: 100,
				// Exponential backoff.
				delayRamp: (delay, nbOfAttempts) => Math.exp(nbOfAttempts) * delay,
				maxAttempts: 3,
				until: (response) => {
					if (
						response?.status &&
						(!retriableStatusCodes.includes(response.status) ||
							response.status >= 500)
					)
						return true;

					return response?.ok ?? false;
				},
				onRetry: async ({ url, response, options, error }) => {
					const headers = new Headers(options.headers);
					options.headers = headers;

					const retryCount =
						Number.parseInt(headers.get("retry-count") || "0") + 1;
					headers.set("retry-count", retryCount.toString());

					const json = await response?.json().catch(() => null);
					const message =
						typeof json === "object" &&
						json !== null &&
						"error" in json &&
						typeof json.error === "object" &&
						json.error !== null &&
						"message" in json.error
							? json.error.message
							: (error?.message ?? response?.statusText);

					console.log(
						options.method,
						url,
						`x${retryCount + 1}`,
						response?.status,
						message
					);
					return { url, options };
				},
				retryOnNetworkError: true,
				resolveWithLatestResponse: true
			})
		].filter(Boolean)
	)
	.errorType("json")
	.defer((wretch, _url, options) => {
		const headers = new Headers(options.headers || {});
		if (headers.get("content-type") === "application/json")
			options.body = JSON.stringify(toSnakeObject(JSON.parse(options.body)));

		const url = new URL(_url);

		return wretch
			.query(
				toSnakeObject(Object.fromEntries(url.searchParams.entries())),
				true
			)
			.headers({
				"idempotency-key": newIdempotencyKey()
			});
	})
	.resolve((resolver) => {
		const _json = resolver.json;
		const json = (async (...arguments_) => {
			const json = await _json.apply(resolver, arguments_);
			return toCamelObject(json);
		}) as typeof resolver.json;

		return Object.assign(resolver, { json });
	});

export interface Issue<T extends string = string> {
	error: T;
	details?: Record<string, unknown>;
}

export interface IssueWithProperties extends Omit<Issue, "details"> {
	details: Record<string, Array<Issue>>;
}

export function isWretchError(
	error: unknown,
	errorType: "invalid_properties"
): error is Omit<WretchError, "json"> & {
	json: IssueWithProperties;
};
export function isWretchError(error: unknown): error is Omit<
	WretchError,
	"json"
> & {
	json: Issue;
};
export function isWretchError(
	error: unknown,
	errorType?: string
): error is Omit<WretchError, "json"> & {
	json: Issue;
} {
	return (
		error instanceof WretchError &&
		(errorType === undefined || error.json?.error === errorType)
	);
}

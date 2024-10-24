import wretch, { type ConfiguredMiddleware } from "wretch";
import QueryAddon from "wretch/addons/queryString";
import AbortAddon from "wretch/addons/abort";
import { retry } from "wretch/middlewares/retry";
import { WretchError } from "wretch/resolver";
import { unstable_noStore } from "next/cache";

import { urls } from "~/urls";
import { newIdempotencyKey, toCamelObject, toSnakeObject } from "~/utilities";
import { environment } from "~/const";

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

					if (environment === "development")
						// Artificially slow requests in development, ensuring we can see
						// loading/pending states.
						await new Promise((resolve) =>
							setTimeout(resolve, options.method === "GET" ? 100 : 200)
						);

					if (
						typeof window === "undefined" &&
						// We can't use `headers` with `unstable_cache` which caches across requests,
						// so when we're using `credentials: "omit"`, we'll exclude the headers.
						options.credentials !== "omit"
					) {
						const { headers } = await import("next/headers");
						const relevantHeaders = Object.fromEntries(
							[...(await headers()).entries()].filter(([key]) =>
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

					const { origin } = new URL(url);
					console.debug(options.method, url.replace(origin, ""));
					const response = await next(url, options);

					console.debug(
						options.method,
						url.replace(origin, ""),
						response.status
					);

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

					const retryAfter = Number.parseInt(
						response?.headers.get("retry-after") || ""
					);

					// If the server tells us to wait more than 10 seconds, we won't retry.
					if (!Number.isNaN(retryAfter) && retryAfter > 10) return true;

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

					const { origin } = new URL(url);

					console.debug(
						"(retry)",
						options.method,
						url.replace(origin, ""),
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

export interface Issue<T extends string = string, D = Record<string, unknown>> {
	error: T;
	details: D;
}

export type InvalidPropertiesIssue = Issue<
	"invalid_properties",
	Record<string, Array<Issue>>
>;

export type WretchIssue<T extends Issue = Issue> = Omit<WretchError, "json"> & {
	json: T;
};

export function isWretchError(
	error: unknown,
	errorType: "invalid_properties"
): error is WretchIssue<InvalidPropertiesIssue>;
export function isWretchError(error: unknown): error is WretchIssue;
export function isWretchError(
	error: unknown,
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	errorType?: string
): error is WretchIssue;
export function isWretchError(
	error: unknown,
	errorType?: string
): error is WretchIssue {
	return (
		error instanceof WretchError &&
		(errorType === undefined || error.json?.error === errorType)
	);
}

if (environment === "development") {
	// @ts-expect-error
	globalThis.api = api;
}

import { P } from "ts-pattern";
import wretch, { type ConfiguredMiddleware } from "wretch";
import AbortAddon from "wretch/addons/abort";
import QueryAddon from "wretch/addons/queryString";
import { retry } from "wretch/middlewares/retry";
import { WretchError } from "wretch/resolver";

import {
	cloudflareInternalIdentifier,
	duringBuild,
	environment,
	maintenance
} from "~/const";
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

export const emptyPaginate: Paginate<unknown> = {
	entries: [],
	metadata: {
		page: 0,
		limit: 0
	}
};

export type PaginateOptions<T> = {
	limit?: number;
	page?: number;
} & T;

const relevantHeaderNames = ["cookie", "authorization"];

// All status codes that are retriable by the browser, except 5xx which are always retried.
const retriableStatusCodes = [408, 429];

const maximumRetries = (environment === "development" || maintenance || duringBuild) ? 0 : 3;

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

					if (!duringBuild && environment === "development")
						// Artificially slow requests in development, ensuring we can see loading/pending states.
						await new Promise((resolve) => setTimeout(resolve, 2000 * Math.random() * (options.method === "GET" ? 1 : 2)));

					if (typeof window === "undefined") {
						// TODO: We're removing API calls from the server, & this will eventually error instead.
						// const error = new Error(`Server-side API call to ${options.method} ${url}.`);
						// error.stack = error.stack?.split("\n").slice(3).join("\n");
						// console.error(error);

						if (
							// We can't use `headers` with `unstable_cache` which caches across requests,
							// so when we're using `credentials: "omit"`, we'll exclude the headers.
							options.credentials !== "omit"
						) {
							const { headers: getHeaders } = await import("next/headers");
							const headers = await getHeaders();

							const relevantHeaders = Object.fromEntries(
								[...headers.entries()].filter(([key]) =>
									relevantHeaderNames.includes(key)
								)
							);

							if (headers.has("user-agent"))
								relevantHeaders["x-forwarded-user-agent"] = headers.get("user-agent")!;

							options.headers = {
								...options.headers,
								...relevantHeaders,
							};
						}
					}

					const headers = new Headers(options.headers);
					if (cloudflareInternalIdentifier)
						headers.set("user-agent", cloudflareInternalIdentifier);

					options.headers = headers;

					return next(url, options);
				};
			}) as ConfiguredMiddleware,
			maximumRetries !== 0 && retry({
				delayTimer: 100,
				// Exponential backoff.
				delayRamp: (delay, nbOfAttempts) => Math.exp(nbOfAttempts) * delay,
				maxAttempts: maximumRetries,
				until: (response) => {
					if (
						response?.status
						&& (!retriableStatusCodes.includes(response.status)
							|| response.status >= 500)
					)
						return true;

					const retryAfter = Number.parseInt(
						response?.headers.get("retry-after") || ""
					);

					// If the server tells us to wait more than 10 seconds, we won't retry.
					if (!Number.isNaN(retryAfter) && retryAfter > 10) return true;

					return response?.ok ?? false;
				},
				onRetry: async ({ url, options, response }) => {
					const headers = new Headers(options.headers);
					options.headers = headers;

					const retryCount
						= Number.parseInt(headers.get("retry-count") || "0") + 1;
					headers.set("retry-count", retryCount.toString());

					const { origin } = new URL(url);

					// eslint-disable-next-line no-console
					console.debug(
						"(retry)",
						options.method,
						url.replace(origin, ""),
						`x${retryCount + 1}`,
						response?.status,
					);
					return { url, options };
				},
				retryOnNetworkError: true,
				resolveWithLatestResponse: true
			})
		].filter(Boolean)
	)
	// .errorType("json")
	.defer((wretch, _url, options) => {
		const headers = new Headers(options.headers || {});
		if (headers.get("content-type") === "application/json" && options.transformRequest !== false)
			// @ts-expect-error: Type mismatch, look into this later.
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

export type WretchIssue<T extends Issue = Issue> = {
	json: T;
} & Omit<WretchError, "json">;

export function isWretchError(
	error: unknown,
	errorType: "invalid_properties"
): error is WretchIssue<InvalidPropertiesIssue>;
export function isWretchError(error: unknown): error is WretchIssue;
export function isWretchError(
	error: unknown,
	errorType?: string
): error is WretchIssue;
export function isWretchError(
	error: unknown,
	errorType?: string
): error is WretchIssue {
	return (
		error instanceof WretchError
		&& (errorType === undefined || error.json?.error === errorType)
	);
}

if (environment === "development") {
	// @ts-expect-error: Expose the API for debugging.
	globalThis.api = api;
}

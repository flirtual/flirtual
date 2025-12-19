import wretch from "wretch";
import type { ConfiguredMiddleware } from "wretch";
import AbortAddon from "wretch/addons/abort";
import QueryAddon from "wretch/addons/queryString";
import { WretchError } from "wretch/resolver";

import { client, development } from "~/const";
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

export interface CursorPaginateMetadata {
	next?: string;
	previous?: string;
	page?: number;
}

export interface CursorPaginate<T> {
	data: Array<T>;
	metadata: CursorPaginateMetadata;
}

export const api = wretch(urls.api)
	.addon(QueryAddon)
	.addon(AbortAddon())
	.options({
		credentials: "include"
	})
	.middlewares(
		[
			(client && development) && ((next) => {
				return async (url, options) => {
					options.headers ??= {};

					// Artificially slow requests in development, ensuring we can see loading/pending states.
					await new Promise((resolve) => setTimeout(resolve, 500 * Math.random() * (options.method === "GET" ? 1 : 2)));

					return next(url, options);
				};
			}) as ConfiguredMiddleware
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

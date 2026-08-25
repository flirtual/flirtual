/* eslint-disable react-refresh/only-export-components */
import type { QueryFunctionContext, QueryKey, QueryState, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { useMutation as _useMutation, useQuery as _useQuery, hashKey, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ms from "ms" with { type: "macro" };
import type { Dispatch, PropsWithChildren } from "react";
import { use, useCallback, useDebugValue, useSyncExternalStore } from "react";

import { getAgeRange } from "./age-range";
import type { AttributeType } from "./api/attributes";
import { Attribute } from "./api/attributes";
import { Authentication } from "./api/auth";
import { isWretchError } from "./api/common";
import type { Issue } from "./api/common";
import { Config } from "./api/config";
import { Conversation } from "./api/conversations";
import type { ProspectKind, QueueIssue } from "./api/matchmaking";
import { Matchmaking } from "./api/matchmaking";
import { Plan } from "./api/plan";
import { User } from "./api/user";
import { Personality } from "./api/user/profile/personality";
import { development, server } from "./const";
import { log as _log } from "./log";
import { getPreferences } from "./preferences";
import { isUid } from "./utilities";

export const configKey = () => ["config"] as const;
export function configFetcher({ signal }: QueryFunctionContext<ReturnType<typeof configKey>>) {
	return Config.get({ ...signal });
}

export const sessionKey = () => ["session"] as const;
export function sessionFetcher({ signal }: QueryFunctionContext<ReturnType<typeof sessionKey>>) {
	return Authentication.getOptionalSession({ ...signal });
}

export const ageRangeKey = () => ["age-range"] as const;
export const ageRangeFetcher = () => getAgeRange();

export const attributeKey = <T extends AttributeType>(type: T, version?: string) => ["attribute", type, version ?? null] as const;
export function attributeFetcher<T extends AttributeType>({ queryKey: [, type, version], signal }: QueryFunctionContext<ReturnType<typeof attributeKey<T>>>) {
	return Attribute.list(type, version ?? undefined, { signal });
}

export const userKey = (userId?: string | null) => ["user", userId || null] as const;
export function userFetcher({ queryKey: [, userId], signal }: QueryFunctionContext<ReturnType<typeof userKey>>) {
	if (!userId) return null;

	return isUid(userId)
		? User.get(userId, { signal })
		: User.getBySlug(userId, { signal });
}

export const relationshipKey = (userId: string) => ["relationship", userId] as const;
export function relationshipFetcher({ queryKey: [, userId], signal }: QueryFunctionContext<ReturnType<typeof relationshipKey>>) {
	return User.getRelationship(userId, { signal });
}

export const userCountKey = () => ["user-count"] as const;
export const userCountFetcher = ({ signal }: QueryFunctionContext<ReturnType<typeof userCountKey>>) => User.getApproximateCount({ signal });

export const queueKey = (kind: ProspectKind) => ["queue", kind] as const;
export function queueFetcher({ queryKey: [, kind], signal }: QueryFunctionContext<ReturnType<typeof queueKey>>) {
	return Matchmaking.queue(kind, { signal })
		.catch((reason) => {
			if (!isWretchError(reason)) throw reason;
			const issue = reason.json as Issue;

			if (!["confirm_email", "finish_profile"].includes(issue.error)) throw reason;
			return issue as QueueIssue;
		});
}

export const likesYouKey = (filters?: { kind?: string; gender?: string }) => ["likes-you", filters ?? {}] as const;
export const likesYouPreviewKey = () => ["likes-you-preview"] as const;

export const conversationsKey = () => ["conversations"] as const;

export const conversationKey = (conversationId: string) => ["conversation", conversationId] as const;
export const conversationFetcher = async ({ queryKey: [, conversationId], signal }: QueryFunctionContext<ReturnType<typeof conversationKey>>) => Conversation.get(conversationId, { signal });

export const plansKey = () => ["plans"] as const;
export const plansFetcher = ({ signal }: QueryFunctionContext<ReturnType<typeof plansKey>>) => Plan.list({ signal });

export const personalityKey = (userId: string) => ["personality", userId] as const;
export const personalityFetcher = ({ queryKey: [, userId], signal }: QueryFunctionContext<ReturnType<typeof personalityKey>>) => Personality.get(userId, { signal });

export const preferencesKey = (key: string) => ["preferences", key] as const;
export function preferencesFetcher<T>({ queryKey: [, key] }: QueryFunctionContext<ReturnType<typeof preferencesKey>>) {
	return getPreferences<T>(key);
}

export async function preloadAll() {
	log("preloadAll()");

	await Promise.all([
		// `staleTime: 0` to force a refetch on every hard-reload.
		preload({ queryKey: configKey(), queryFn: configFetcher, staleTime: 0 }),
		preload({ queryKey: sessionKey(), queryFn: sessionFetcher, staleTime: 0 }),

		preload({ queryKey: plansKey(), queryFn: plansFetcher }),

		preload({ queryKey: ageRangeKey(), queryFn: ageRangeFetcher, staleTime: Number.POSITIVE_INFINITY }),

		// ...([
		// 	"country",
		// 	"game",
		// 	"gender",
		// 	"interest",
		// 	"interest-category",
		// 	"kink",
		// 	"language",
		// 	"platform",
		// 	"prompt",
		// 	"relationship",
		// 	"sexuality"
		// ] as const).map((type) => preload({
		// 	queryKey: attributeKey(type),
		// 	queryFn: attributeFetcher
		// }))
	]).catch((reason) => {
		log("preloadAll() failed: %o", reason);
	});
}

const log = _log.extend("query");

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			experimental_prefetchInRender: true,
			throwOnError: true,
			retry: development
				// Never retry failed queries in development.
				? false
				: (attempt, error) => {
						if (error.name === "TimeoutError") return true;
						if (isWretchError(error) && [400, 401, 403, 429].includes(error.status)) return false;
						return true;
					},
			retryDelay: (attempt) => Math.min(100 * 2 ** attempt, 60000),
			staleTime: ms("5m"),
			gcTime: ms("1h"),
		},
	},
});

// @ts-expect-error: https://github.com/DeeCode-inc/tanstack-query-chrome-devtools
globalThis.__TANSTACK_QUERY_CLIENT__ = queryClient;

const queryCache = queryClient.getQueryCache();

interface Meta extends Record<string, unknown> {
	cacheTime?: number;
}

declare module "@tanstack/react-query" {
	interface Register {
		queryMeta: Meta;
		mutationMeta: Meta;
	}
}

export type MinimalQueryOptions<T> = Pick<UseQueryOptions<T, Error, T, QueryKey>, "placeholderData">;

export async function evictQueries() {
	log("evictQueries()");

	await queryClient.resetQueries();
}

let usedQuery = false;

export function useQuery<
	T = unknown,
	Key extends QueryKey = ReadonlyArray<unknown>
>(options: Omit<UseQueryOptions<T, Error, T, Key>, "placeholderData">): T;
export function useQuery<
	T = unknown,
	Key extends QueryKey = ReadonlyArray<unknown>,
	P = unknown
>(options: { placeholderData: P } & Omit<UseQueryOptions<T, Error, T, Key>, "placeholderData">): P | T;
export function useQuery<
	T = unknown,
	Key extends QueryKey = ReadonlyArray<unknown>
>({
	queryKey,
	queryFn,
	placeholderData,
	enabled = true,
	...options
}: UseQueryOptions<T, Error, T, Key>): unknown {
	useDebugValue(queryKey);

	if (!usedQuery) {
		log("used useQuery() for the first time.");
		usedQuery = true;
	}

	if (server) {
		if (placeholderData !== undefined)
			return placeholderData as T;
	}

	if (!enabled && placeholderData === undefined)
		throw new Error(`useQuery(${queryKey}) called without placeholderData while disabled. This will permanently suspend the component.`);

	const { promise } = _useQuery({
		queryKey,
		queryFn,
		placeholderData,
		enabled,
		...options
	}, queryClient);

	return use(promise);
}

const emptyQueryState = {};

export function useQueryState<T>(queryKey: QueryKey): Partial<QueryState<T>> {
	const queryHash = hashKey(queryKey);

	// Read through the cache on every render, so a changed key doesn't keep
	// serving the previous query's state until the new one happens to emit.
	return useSyncExternalStore(
		useCallback((onChange) => queryCache.subscribe(({ query }) => {
			if (query.queryHash === queryHash) onChange();
		}), [queryHash]),
		() => queryCache.get<T>(queryHash)?.state
	) || emptyQueryState;
}

export function useMutation<T = unknown, Variables = void, Context = unknown>({
	mutationKey,
	onSuccess,
	...options
}: UseMutationOptions<T, Error, Variables, Context>) {
	useDebugValue(mutationKey);

	return _useMutation({
		...options,
		mutationKey,
		scope: mutationKey
			? {
					// We're using the `mutationKey` as the scope to ensure that all
					// mutations with the same key are sent sequentially.
					id: hashKey(mutationKey),
				}
			: undefined,
		onSuccess: (data, variables, onMutateResult, context) => {
			if (mutationKey && data !== undefined)
				mutate(mutationKey, data);

			return onSuccess?.(data, variables, onMutateResult, context);
		},
	}, queryClient);
}

/**
 * @see https://tanstack.com/query/v5/docs/reference/QueryClient/#queryclientsetquerydata
 */
export async function mutate<T>(queryKey: QueryKey, data: Dispatch<T> | T) {
	await queryClient.cancelQueries({ queryKey });

	queryClient.setQueryData<T>(queryKey, (previous) => {
		const newData = typeof data === "function" ? (data as any)(previous) : data;
		log("%s(%o) => %o", mutate.name, queryKey, newData);

		return newData;
	});
}

/**
 * @see https://tanstack.com/query/v5/docs/reference/QueryClient/#queryclientinvalidatequeries
 */
export const invalidate = queryClient.invalidateQueries.bind(queryClient);

/**
 * @see https://tanstack.com/query/v5/docs/reference/QueryClient/#queryclientprefetchquery
 */
export const preload = queryClient.prefetchQuery.bind(queryClient);

export function QueryProvider({ children }: PropsWithChildren) {
	return (
		<QueryClientProvider client={queryClient}>
			{development && <ReactQueryDevtools client={queryClient} />}
			{children}
		</QueryClientProvider>
	);
}

export { useInfiniteQuery } from "@tanstack/react-query";

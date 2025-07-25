/* eslint-disable react-refresh/only-export-components */
"use client";

import type { QueryFunctionContext, QueryKey, QueryState, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { useMutation as _useMutation, useQuery as _useQuery, hashKey, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ms from "ms";
import type { Dispatch, PropsWithChildren } from "react";
import { use, useDebugValue, useEffect, useState } from "react";

import type { AttributeType } from "./api/attributes";
import { Attribute } from "./api/attributes";
import { Authentication } from "./api/auth";
import { Config } from "./api/config";
import { Conversation, type ConversationList } from "./api/conversations";
import { Matchmaking, type ProspectKind } from "./api/matchmaking";
import { Plan } from "./api/plan";
import { User } from "./api/user";
import { Personality } from "./api/user/profile/personality";
import { development, gitCommitSha, server } from "./const";
import { postpone } from "./hooks/use-postpone";
import { log as _log } from "./log";
import { getPreferences, setPreferences } from "./preferences";
import { isUid } from "./utilities";

export const configKey = () => ["config"] as const;
export function configFetcher({ signal }: QueryFunctionContext<ReturnType<typeof configKey>>) {
	return Config.get({ ...signal });
}

export const sessionKey = () => ["session"] as const;
export function sessionFetcher({ signal }: QueryFunctionContext<ReturnType<typeof sessionKey>>) {
	return Authentication.getOptionalSession({ ...signal });
}

export const attributeKey = <T extends AttributeType>(type: T) => ["attribute", type] as const;
export function attributeFetcher<T extends AttributeType>({ queryKey: [, type], signal }: QueryFunctionContext<ReturnType<typeof attributeKey<T>>>) {
	return Attribute.list(type, { signal });
}

export const userKey = (userId: string) => ["user", userId] as const;
export function userFetcher({ queryKey: [, userId], signal }: QueryFunctionContext<ReturnType<typeof userKey>>) {
	return isUid(userId)
		? User.get(userId, { signal })
		: User.getBySlug(userId, { signal });
}

export const relationshipKey = (userId: string) => ["relationship", userId] as const;
export function relationshipFetcher({ queryKey: [, userId], signal }: QueryFunctionContext<ReturnType<typeof relationshipKey>>) {
	return User.getRelationship(userId, { signal });
}

export const queueKey = (kind: ProspectKind) => ["queue", kind] as const;
export function queueFetcher({ queryKey: [, kind], signal }: QueryFunctionContext<ReturnType<typeof queueKey>>) {
	return Matchmaking.queue(kind, { signal });
}

export const likesYouKey = () => ["likes-you"] as const;
export const likesYouFetcher = () => Matchmaking.likesYou();

export function conversationsKey() {
	return (page: number, list: ConversationList) => {
		if (list && list.data.length < list.metadata.cursor.self.limit) return null;
		if (page === 0) return ["conversations", null];
		return ["conversations", list.metadata.cursor.next];
	};
}
export const conversationsFetcher = async ([, cursor]: [unknown, string]) => Conversation.list(cursor);

export const plansKey = () => ["plans"] as const;
export const plansFetcher = () => Plan.list();

export const personalityKey = (userId: string) => ["personality", userId] as const;
export const personalityFetcher = ({ queryKey: [, userId] }: QueryFunctionContext<ReturnType<typeof personalityKey>>) => Personality.get(userId);

export const preferencesKey = (key: string) => ["preferences", key] as const;
export function preferencesFetcher<T>({ queryKey: [, key] }: QueryFunctionContext<ReturnType<typeof preferencesKey>>) {
	return getPreferences<T>(key);
}

export async function preloadAll() {
	log("%s()", preloadAll.name);

	await Promise.all([
		// `staleTime: 0` to force a refetch on every hard-reload.
		preload({ queryKey: configKey(), queryFn: configFetcher, staleTime: 0 }),
		preload({ queryKey: sessionKey(), queryFn: sessionFetcher, staleTime: 0 }),
		preload({ queryKey: plansKey(), queryFn: plansFetcher }),
		...([
			"country",
			"game",
			"gender",
			"interest",
			"interest-category",
			"kink",
			"language",
			"platform",
			"prompt",
			"relationship",
			"report-reason",
			"sexuality"
		] as const).map((type) => preload({
			queryKey: attributeKey(type),
			queryFn: attributeFetcher
		}))
	]).catch((reason) => {
		log("%s() failed: %o", preloadAll.name, reason);
	});
}

const log = _log.extend("query");

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			experimental_prefetchInRender: true,
			// retry: environment !== "development",
			throwOnError: true,
			retry: true,
			retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 60000),
			staleTime: ms("5m"),
			gcTime: ms("1h"),
		},
	},
});

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

interface QueryPreference {
	v: string;
	q: Array<{
		k: QueryKey;
		h: string;
		a?: number;
		s: QueryState;
	}>;
}

export type MinimalQueryOptions<T> = Pick<UseQueryOptions<T, Error, T, QueryKey>, "placeholderData">;

const cacheVersion = gitCommitSha;
const defaultCacheTime = ms("1d");

export async function saveQueries() {
	log("%s()", saveQueries.name);
	const queries = queryCache.getAll();

	const eligibleQueries = queries.filter(({
		queryKey,
		queryHash,
		state,
		meta: { cacheTime = defaultCacheTime } = {}
	}) => {
		if (!queryKey || !queryHash || !state.dataUpdatedAt || cacheTime === 0) return false;
		if (state.status !== "success") return false;

		return true;
	}).map(({
		queryKey,
		queryHash,
		state,
		meta: { cacheTime } = {}
	}) => ({
		k: queryKey,
		h: queryHash,
		a: cacheTime,
		s: state
	}));

	await setPreferences<QueryPreference>("queries", {
		v: cacheVersion,
		q: eligibleQueries
	});
}

export async function evictQueries() {
	log("%s()", evictQueries.name);
	queryCache.clear();
	await setPreferences("queries", null);
}

export async function restoreQueries() {
	log("%s()", restoreQueries.name);

	const { v: version, q: potentialQueries } = await getPreferences<QueryPreference>("queries") || { v: cacheVersion, q: [] };

	if (version !== cacheVersion) {
		log("Cache version mismatch.");
		await evictQueries();

		return;
	}

	const queries = potentialQueries.map(({
		k: queryKey,
		h: queryHash,
		a: cacheTime = defaultCacheTime,
		s: state
	}) => {
		if (Date.now() - state.dataUpdatedAt > Math.min(cacheTime, defaultCacheTime)) return null;
		if (state.status !== "success") return null;

		return queryCache.build(queryClient, { queryKey, queryHash }, state);
	}).filter(Boolean);

	log("%s() => %O", restoreQueries.name, new Map(queries.map(({ queryKey, state: { data } }) => [queryKey, data])));
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
		if (placeholderData === undefined)
			postpone("useQuery() without placeholderData");

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

	try {
		return use(promise);
	}
	catch (reason) {
		if (reason instanceof Error && reason.message.includes("Suspense Exception"))
			throw reason;

		log("useQuery(%o) failed: %o", queryKey, reason);
		throw reason;
	}
}

export function useQueryState(queryKey: QueryKey) {
	const queryHash = hashKey(queryKey);
	const [state, setState] = useState(() => queryClient.getQueryState(queryKey));

	useEffect(() => queryCache.subscribe(({ query, }) => {
		if (query.queryHash !== queryHash) return;
		setState(query.state);
	}));

	return state;
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
		onSuccess: (data, variables, context) => {
			if (mutationKey && data !== undefined)
				mutate(mutationKey, data);

			return onSuccess?.(data, variables, context);
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

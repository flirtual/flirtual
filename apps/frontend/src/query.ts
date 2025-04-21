import type { FetchQueryOptions, QueryFunctionContext, QueryKey, QueryState, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { useMutation as _useMutation, useQuery as _useQuery, hashKey, QueryClient } from "@tanstack/react-query";
import ms from "ms";
import type { Dispatch } from "react";
import { use, useDebugValue } from "react";

import type { AttributeType } from "./api/attributes";
import { Attribute } from "./api/attributes";
import { Authentication } from "./api/auth";
import { Config } from "./api/config";
import { Conversation, type ConversationList } from "./api/conversations";
import { Matchmaking, type ProspectKind } from "./api/matchmaking";
import { Plan } from "./api/plan";
import { User } from "./api/user";
import { Personality } from "./api/user/profile/personality";
import { environment, gitCommitSha, server } from "./const";
import { usePostpone } from "./hooks/use-postpone";
import { getPreference, listPreferences, setPreference } from "./hooks/use-preferences";
import { log as _log } from "./log";
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
	return getPreference<T>(key);
}

export async function preloadAll() {
	log("%s()", preloadAll.name);

	await Promise.all([
		// `staleTime: 0` to force a refetch on every hard-reload.
		preload(configKey(), configFetcher, { staleTime: 0 }),
		preload(sessionKey(), sessionFetcher, { staleTime: 0 }),
		preload(plansKey(), plansFetcher),
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
		] as const).map((type) => preload(attributeKey(type), attributeFetcher))
	]).catch(() => {});
}

const log = _log.extend("query");

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			experimental_prefetchInRender: true,
			retry: environment !== "development",
			staleTime: ms("5m"),
			gcTime: ms("24h"),
		},
	},
});

const queryCache = queryClient.getQueryCache();

interface Meta extends Record<string, unknown> {
	maxAge?: number;
}

declare module "@tanstack/react-query" {
	interface Register {
		queryMeta: Meta;
		mutationMeta: Meta;
	}
}

interface PersistedQuery {
	k: QueryKey;
	h: string;
	v: string;
	a: number;
	s: QueryState;
}

const cacheVersion = gitCommitSha;
const defaultMaxAge = ms("7d");

const persistedQueryKey = (queryHash: string) => `query.${queryHash}` as const;

async function evictQuery({ queryKey, queryHash }: { queryKey: QueryKey; queryHash: string }, reason?: string) {
	await setPreference(persistedQueryKey(queryHash), null);
	log(`%o was evicted${reason ? ` due to ${reason}` : ""}.`, queryKey);
}

export async function saveQueries() {
	log("%s()", saveQueries.name);
	const queries = queryCache.getAll();

	await Promise.all(queries.map(async ({
		queryKey,
		queryHash,
		state,
		meta: { maxAge = defaultMaxAge } = {}
	}) => {
		if (!queryKey || !queryHash || !state.dataUpdatedAt || maxAge === 0) return;
		if (state.status !== "success") {
			await evictQuery({ queryKey, queryHash }, "status");
			return;
		}

		await setPreference<PersistedQuery>(persistedQueryKey(queryHash), {
			k: queryKey,
			h: queryHash,
			v: cacheVersion,
			a: maxAge,
			s: state
		});
	}));
}

export async function restoreQueries() {
	log("%s()", restoreQueries.name);

	const keys = (await listPreferences())
		.filter((key) => key.startsWith(persistedQueryKey("")))
		.sort();

	await Promise.all(keys.map(async (key) => {
		const {
			k: queryKey,
			h: queryHash,
			v: version,
			a: maxAge,
			s: state
		} = (await getPreference<PersistedQuery>(key))!;

		if (!version || version !== cacheVersion) {
			await evictQuery({ queryKey, queryHash }, "version mismatch");
			return;
		}

		if (!maxAge || Date.now() - state.dataUpdatedAt > maxAge) {
			await evictQuery({ queryKey, queryHash }, "age");
			return;
		}

		queryCache.build(queryClient, { queryKey, queryHash }, state);
		// log("%o was restored: %o", queryKey, state.data);
	}));

	log("%s() => %O", restoreQueries.name, new Map(queryCache.getAll().map(({ queryKey, state: { data } }) => [queryKey, data])));
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
			// eslint-disable-next-line react-hooks/rules-of-hooks
			usePostpone("useQuery() without placeholderData");

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

export function preload<K extends QueryKey = QueryKey>(
	queryKey: K,
	// eslint-disable-next-line unicorn/prevent-abbreviations
	queryFn: UseQueryOptions<unknown, unknown, unknown, K>["queryFn"],
	options: Omit<FetchQueryOptions<unknown, unknown, unknown, K>, "queryFn" | "queryKey"> = {}
) {
	log("%s(%o)", preload.name, queryKey);

	return queryClient.prefetchQuery({
		...options,
		queryKey,
		queryFn,
	});
}

/**
 * @see https://tanstack.com/query/v5/docs/reference/QueryClient/#queryclientsetquerydata
 */
export async function mutate<T>(queryKey: QueryKey, data: Dispatch<T> | T) {
	await queryClient.cancelQueries({ queryKey });
	queryClient.setQueryData(queryKey, (previous) => {
		const newData = typeof data === "function" ? data(previous) : data;
		log("%s(%o) => %o", mutate.name, queryKey, newData);
		return newData;
	});
}

/**
 * @see https://tanstack.com/query/v5/docs/reference/QueryClient/#queryclientinvalidatequeries
 */
export const invalidate = queryClient.invalidateQueries.bind(queryClient);

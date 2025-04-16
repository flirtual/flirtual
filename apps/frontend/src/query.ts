import type { FetchQueryOptions, QueryFunctionContext, QueryKey, QueryState, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { useMutation as _useMutation, useQuery as _useQuery, QueryClient } from "@tanstack/react-query";
import ms from "ms";
import type { Dispatch } from "react";
import { use, useDebugValue } from "react";

import type { AttributeType } from "./api/attributes";
import { Attribute } from "./api/attributes";
import { Authentication } from "./api/auth";
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
	log("preloadAll()");

	await Promise.all([
		preload(sessionKey(), sessionFetcher),
		// preload(likesYouKey(), likesYouFetcher),
		// preload(conversationsKey(), conversationsFetcher),
		preload(plansKey(), plansFetcher),
		// We exclude some attributes, as they are only used in specific contexts.
		// We don't want to prematurely send requests for them if we don't need to.
		// ...([
		// "country",
		// "game",
		// 	"gender",
		// 	"interest",
		// "interest-category",
		// "kink",
		// "language",
		// "platform",
		// "prompt",
		// "relationship",
		// "sexuality"
		// ] as const).map((type) => preload(attributeKey(type), attributeFetcher)),
		// ...location.pathname === "/browse"
		// 	? prospectKinds.map((kind) => preload(queueKey(kind), queueFetcher))
		// 	: [],
	// We don't care about the result of these requests, so we can ignore them.
	]).catch(() => {});
}

const log = _log.extend("query");

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			experimental_prefetchInRender: true,
			retry: environment !== "development",
			staleTime: ms("30s"),
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
	await setPreference(persistedQueryKey(queryHash), null, { mutate: false });
	log(`%o was evicted${reason ? ` due to ${reason}` : ""}.`, queryKey);
}

export async function saveQueries() {
	log("saveQueries()");
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
		}, { mutate: false });
	}));
}

export async function restoreQueries() {
	log("restoreQueries()");

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
		log("%o was restored: %o", queryKey, state.data);
	}));

	log("restoreQueries() => %O", new Map(queryCache.getAll().map(({ queryHash, state: { data } }) => [queryHash, data])));
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
	});

	const value = use(promise);
	// console.log("useQuery(%s) => %o", queryKey, value);

	return value;
}

export function useMutation<T = unknown, Variables = void>({
	mutationKey,
	onMutate,
	onSuccess,
	onError,
	...options
}: UseMutationOptions<T, Error, Variables, unknown>) {
	useDebugValue(mutationKey);

	return _useMutation({
		...options,
		mutationKey,
		onMutate: (variables) => {
			log("onMutate(%o) => %o", mutationKey, variables);
			return onMutate?.(variables);
		},
		onSuccess: (data, variables, context) => {
			log("onSuccess(%o) => %o", mutationKey, data);

			if (mutationKey && data !== undefined)
				mutate(mutationKey, data);

			return onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			console.error("onError(%o) => %o", mutationKey, error);
			return onError?.(error, variables, context);
		},
	}, queryClient);
}

export function preload<K extends QueryKey = QueryKey>(
	queryKey: K,
	// eslint-disable-next-line unicorn/prevent-abbreviations
	queryFn: UseQueryOptions<unknown, unknown, unknown, K>["queryFn"],
	options: Omit<FetchQueryOptions<unknown, unknown, unknown, K>, "queryFn" | "queryKey"> = {}
) {
	log("preload(%o)", queryKey);

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
	queryClient.setQueryData(queryKey, data);

	log("mutate(%o) => %o", queryKey, data);
}

/**
 * @see https://tanstack.com/query/v5/docs/reference/QueryClient/#queryclientinvalidatequeries
 */
export const invalidate = queryClient.invalidateQueries.bind(queryClient);

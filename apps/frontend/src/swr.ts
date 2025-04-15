/* eslint-disable no-restricted-imports */

import { experimental_createPersister } from "@tanstack/query-persist-client-core";
import type { QueryFunctionContext, QueryKey, UseQueryOptions } from "@tanstack/react-query";
import { useQuery as _useQuery, QueryClient } from "@tanstack/react-query";
import ms from "ms";
import { use, useDebugValue } from "react";
import type { SWRConfiguration } from "swr";

import type { AttributeType } from "./api/attributes";
import { Attribute, AttributeCollection } from "./api/attributes";
import type { Session } from "./api/auth";
import { Authentication } from "./api/auth";
import { Conversation, type ConversationList } from "./api/conversations";
import { Matchmaking, type ProspectKind, prospectKinds } from "./api/matchmaking";
import { Plan } from "./api/plan";
import { User } from "./api/user";
import { Personality } from "./api/user/profile/personality";
import { isClient, isServer } from "./const";
import { usePostpone } from "./hooks/use-postpone";
import { getPreference, setPreference } from "./hooks/use-preferences";
// export const cacheMap: Map<string, State<unknown>> = isClient
// 	? new Map<string, State<unknown>>(await getPreference("app-cache") ?? [])
// 	: new Map<string, State<unknown>>();
//
// if (isClient) {
// 	window.addEventListener("beforeunload", () => {
// 		setPreference("app-cache", Array.from(cacheMap.entries()));
// 	});
// }
import { isUid, skipErrorStack } from "./utilities";

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
export const personalityFetcher = ([, userId]: ReturnType<typeof personalityKey>) => Personality.get(userId);

export const preferencesKey = (key: string) => ["preferences", key] as const;
export function preferencesFetcher<T>({ queryKey: [, key] }: QueryFunctionContext<ReturnType<typeof preferencesKey>>) {
	return getPreference<T>(key);
}

export async function preloadAll() {
	return Promise.all([
		// preload(sessionKey, sessionFetcher),
		// preload(likesYouKey(), likesYouFetcher),
		// preload(conversationsKey(), conversationsFetcher),
		// preload(plansKey(), plansFetcher),
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

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			b
			experimental_prefetchInRender: true,
			retry: false,
			staleTime: ms("1m"),
			gcTime: ms("24h"),
			persister: experimental_createPersister({
				storage: {
					getItem: getPreference,
					setItem: setPreference,
					removeItem: (key) => setPreference(key, null)
				},
				maxAge: ms("24h")
			}),
		},
	},
});

export function useQuery<
	T = unknown,
	Key extends QueryKey = ReadonlyArray<unknown>
>(options: Omit<UseQueryOptions<T, Error, T, Key>, "placeholderData">): { data: T };
export function useQuery<
	T = unknown,
	Key extends QueryKey = ReadonlyArray<unknown>,
	P = unknown
>(options: { placeholderData: P } & Omit<UseQueryOptions<T, Error, T, Key>, "placeholderData">): { data: P | T };
export function useQuery<
	T = unknown,
	Key extends QueryKey = ReadonlyArray<unknown>
>({
	queryKey,
	queryFn,
	placeholderData,
	...options
}: UseQueryOptions<T, Error, T, Key>): { data: unknown } {
	useDebugValue(queryKey);

	if (isServer) {
		if (placeholderData === undefined) {
			console.warn("useQuery(%s) called without placeholderData", queryKey);
			// eslint-disable-next-line react-hooks/rules-of-hooks
			usePostpone("useQuery() without placeholderData");
		}

		console.warn("useQuery(%s) bailed", queryKey);
		return { data: placeholderData as T || null };
	}

	const { promise } = _useQuery({
		queryKey,
		queryFn,
		placeholderData,
		...options
	});

	const data = use(promise);
	return { data };
}

// @ts-expect-error: Complex type.
const useSuspenseSWR: SWRHook = (
	key: unknown,
	fetcher: unknown,
	{ suspense = true, fallbackData, ...config }: SWRConfiguration = {}
) => {
	useDebugValue(key);
	return { data: fallbackData || null };

	if (fallbackData === undefined && suspense)
		// eslint-disable-next-line react-hooks/rules-of-hooks
		usePostpone("useSWR() without fallbackData");

	const { promise } = useQuery({
		...config,
		queryKey: key,
		queryFn: (a) => {
			console.log({ a, fetcher });
			const { queryKey } = a;
			return fetcher(queryKey);
		},
		initialData: fallbackData,
	});

	const data = use(promise);
	return { data };
};

/* // @ts-expect-error: Complex type.
const useSuspenseSWR: SWRHook = (
	key: unknown,
	fetcher: unknown,
	{ suspense = true, fallbackData, ...config }: SWRConfiguration = {}
) => {
	useDebugValue(key);
	// eslint-disable-next-line no-console
	console.log("useSuspenseSWR(%s)", key, { suspense, fallbackData, ...config });

	if (fallbackData === undefined && suspense)
		// eslint-disable-next-line react-hooks/rules-of-hooks
		usePostpone("useSWR() without fallbackData");

	// @ts-expect-error: Complex type.
	return useSWR(key, fetcher, {
		suspense,
		fallbackData,
		...config
	});
}; */

export {
	mutate,
	SWRConfig,
	type SWRConfiguration,
	unstable_serialize,
	default as useLazySWR,
	useSWRConfig
} from "swr";

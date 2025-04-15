/* eslint-disable no-restricted-imports */

import { useDebugValue } from "react";
import type { SWRConfiguration } from "swr";
import useSWR, { preload } from "swr";
import type { State, SWRHook } from "swr/_internal";
import type { WretchOptions } from "wretch";

import { Attribute, type AttributeType } from "./api/attributes";
import { Authentication } from "./api/auth";
import { Conversation, type ConversationList } from "./api/conversations";
import { Matchmaking, type ProspectKind, prospectKinds } from "./api/matchmaking";
import { Plan } from "./api/plan";
import { User } from "./api/user";
import { Personality } from "./api/user/profile/personality";
import { isClient } from "./const";
import { usePostpone } from "./hooks/use-postpone";
import { getPreference, setPreference } from "./hooks/use-preferences";
import { isUid } from "./utilities";

export const sessionKey = () => "session" as const;
export const sessionFetcher = () => Authentication.getOptionalSession();

export const attributeKey = <T extends AttributeType>(type: T) => ["attribute", type] as const;
export const attributeFetcher = ([, type]: ReturnType<typeof attributeKey>) => Attribute.list(type);

export const userKey = (userId: string, options: WretchOptions = {}) => ["user", userId, options] as const;
export function userFetcher([, userId, options]: ReturnType<typeof userKey>) {
	return isUid(userId)
		? User.get(userId, options)
		: User.getBySlug(userId, options);
}

export const relationshipKey = (userId: string) => ["relationship", userId] as const;
export const relationshipFetcher = ([, userId]: ReturnType<typeof relationshipKey>) => User.getRelationship(userId);

export const queueKey = (kind: ProspectKind) => ["queue", kind] as const;
export const queueFetcher = ([, kind]: ReturnType<typeof queueKey>) => Matchmaking.queue(kind);

export const likesYouKey = () => "likes-you" as const;
export const likesYouFetcher = () => Matchmaking.likesYou();

export function conversationsKey() {
	return (page: number, list: ConversationList) => {
		if (list && list.data.length < list.metadata.cursor.self.limit) return null;
		if (page === 0) return ["conversations", null];
		return ["conversations", list.metadata.cursor.next];
	};
}
export const conversationsFetcher = async ([, cursor]: [unknown, string]) => Conversation.list(cursor);

export const plansKey = () => "plans" as const;
export const plansFetcher = () => Plan.list();

export const personalityKey = (userId: string) => ["personality", userId] as const;
export const personalityFetcher = ([, userId]: ReturnType<typeof personalityKey>) => Personality.get(userId);

export const preferencesKey = (key: string) => ["preferences", key] as const;
export const preferencesFetcher = ([, key]: ReturnType<typeof preferencesKey>) => getPreference(key);

export async function preloadAll() {
	return Promise.all([
		preload(sessionKey, sessionFetcher),
		// preload(likesYouKey(), likesYouFetcher),
		// preload(conversationsKey(), conversationsFetcher),
		// preload(plansKey(), plansFetcher),
		// We exclude some attributes, as they are only used in specific contexts.
		// We don't want to prematurely send requests for them if we don't need to.
		...([
			// "country",
			// "game",
			"gender",
			"interest",
			// "interest-category",
			// "kink",
			// "language",
			// "platform",
			// "prompt",
			// "relationship",
			// "sexuality"
		] as const).map((type) => preload(attributeKey(type), attributeFetcher)),
		// ...location.pathname === "/browse"
		// 	? prospectKinds.map((kind) => preload(queueKey(kind), queueFetcher))
		// 	: [],
	// We don't care about the result of these requests, so we can ignore them.
	]).catch(() => {});
}

// export const cacheMap: Map<string, State<unknown>> = isClient
// 	? new Map<string, State<unknown>>(await getPreference("app-cache") ?? [])
// 	: new Map<string, State<unknown>>();
//
// if (isClient) {
// 	window.addEventListener("beforeunload", () => {
// 		setPreference("app-cache", Array.from(cacheMap.entries()));
// 	});
// }

// @ts-expect-error: Complex type.
const useSuspenseSWR: SWRHook = (
	key: unknown,
	fetcher: unknown,
	{ suspense = true, fallbackData, ...config }: SWRConfiguration = {}
) => {
	useDebugValue(key);

	if (fallbackData === undefined && suspense)
		// eslint-disable-next-line react-hooks/rules-of-hooks
		usePostpone("useSWR() without fallbackData");

	// @ts-expect-error: Complex type.
	return useSWR(key, fetcher, {
		suspense,
		fallbackData,
		...config
	});
};

export { preload, useSuspenseSWR as useSWR };

export {
	mutate,
	SWRConfig,
	type SWRConfiguration,
	unstable_serialize,
	default as useLazySWR,
	useSWRConfig
} from "swr";

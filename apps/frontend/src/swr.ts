/* eslint-disable no-restricted-imports */

import type { SWRConfiguration } from "swr";
import useSWR from "swr";
import type { SWRHook } from "swr/_internal";
import type { WretchOptions } from "wretch";

import type { AttributeType } from "./api/attributes";
import { Authentication } from "./api/auth";
import type { ProspectKind } from "./api/matchmaking";
import { User } from "./api/user";
import { usePostpone } from "./hooks/use-postpone";
import { isUid } from "./utilities";

export const sessionKey = () => "session" as const;
export const sessionFetcher = () => Authentication.getOptionalSession();

export function attributeKey<T extends AttributeType>(type: T) {
	return ["attribute", type] as const;
}

export const userKey = (userId: string, options: WretchOptions = {}) => ["user", userId, options] as const;
export function userFetcher([, userId, options]: ReturnType<typeof userKey>) {
	return isUid(userId)
		? User.get(userId, options)
		: User.getBySlug(userId, options);
}

export const relationshipKey = (userId: string) => ["relationship", userId] as const;
export const relationshipFetcher = ([, userId]: ReturnType<typeof relationshipKey>) => User.getRelationship(userId);

export const queueKey = (kind: ProspectKind) => ["queue", kind] as const;

export const likesYouKey = () => "likes-you" as const;

// @ts-expect-error: Complex type.
const useSuspenseSWR: SWRHook = (
	key: unknown,
	fetcher: unknown,
	config: SWRConfiguration
) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	if (!("fallbackData" in config)) usePostpone("useSWR() without fallbackData");
	// @ts-expect-error: Complex type.
	return useSWR(key, fetcher, {
		suspense: true,
		...config
	});
};

export { useSuspenseSWR as useSWR, };

export {
	mutate,
	preload,
	type SWRConfiguration,
	unstable_serialize,
	// default as useSWR,
	useSWRConfig
} from "swr";

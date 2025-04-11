import type { WretchOptions } from "wretch";

import type { AttributeType } from "./api/attributes";
import type { ProspectKind } from "./api/matchmaking";
import { User } from "./api/user";
import { isUid } from "./utilities";

export const sessionKey = () => "session";

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

export const likesYouKey = () => "likes-you";

import type { AttributeType } from "./api/attributes";
import type { ProspectKind } from "./api/matchmaking";
import { User } from "./api/user";

export const sessionKey = () => "session";

export function attributeKey<T extends AttributeType>(type: T) {
	return ["attribute", type] as const;
}

export const userKey = (userId: string) => ["user", userId] as const;
export const userFetcher = ([, userId]: ReturnType<typeof userKey>) => User.get(userId);

export const relationshipKey = (userId: string) => ["relationship", userId] as const;
export const relationshipFetcher = ([, userId]: ReturnType<typeof relationshipKey>) => User.getRelationship(userId);

export const queueKey = (kind: ProspectKind) => ["queue", kind] as const;

export const likesYouKey = () => "likes-you";

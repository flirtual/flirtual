import type { AttributeType } from "./api/attributes";
import type { ProspectKind } from "./api/matchmaking";
import { User } from "./api/user";

export function attributeKey<T extends AttributeType>(type: T) {
	return ["attribute", type] as const;
}

export const userKey = (userId: string) => ["user", userId] as const;
export function userFetcher([, userId]: readonly [never, string]) {
	return User.get(userId);
}

export const queueKey = (kind: ProspectKind) => ["queue", kind] as const;

export const likesYouKey = () => "likes-you";

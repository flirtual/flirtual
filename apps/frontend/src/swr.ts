import { User } from "./api/user";

import type { AttributeType } from "./api/attributes";
import type { ProspectKind } from "./api/matchmaking";

export const attributeKey = <T extends AttributeType>(type: T) =>
	["attribute", type] as const;

export const userKey = (userId: string) => ["user", userId] as const;
export const userFetcher = ([, userId]: readonly [never, string]) =>
	User.get(userId);

export const queueKey = (kind: ProspectKind) => ["queue", kind] as const;

import type { User } from "~/api/user";
import type { Relationship } from "~/api/user/relationship";
import {
	relationshipFetcher,
	relationshipKey,
	useQuery,
	// 	userCountFetcher,
	// 	userCountKey,
	userFetcher,
	userKey,
} from "~/query";
import { isUid } from "~/utilities";

import { useSession } from "./use-session";

export function useUser(userId?: string | null): User | null {
	const { user: me } = useSession();

	const user = useQuery({
		queryKey: userKey(userId),
		queryFn: (context) => {
			if (userId && (isUid(userId) ? me.id === userId : me.slug === userId))
				return me;

			return userFetcher(context);
		}
	});

	if (user?.id === me.id) return me;
	return user;
}

export function useRelationship(userId: string): Relationship | null {
	return useQuery({
		queryKey: relationshipKey(userId),
		queryFn: relationshipFetcher,
	});
}

// eslint-disable-next-line react-hooks-extra/no-unnecessary-use-prefix
export function useUserCount() {
	return 100_000;

	// return useQuery({
	// 	queryKey: userCountKey(),
	// 	queryFn: userCountFetcher
	// });
}

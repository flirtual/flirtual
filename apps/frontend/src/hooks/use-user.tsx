"use client";

import type { User } from "~/api/user";
import type { Relationship } from "~/api/user/relationship";
import {
	relationshipFetcher,
	relationshipKey,
	useQuery,
	userFetcher,
	userKey,
} from "~/query";

import { useSession } from "./use-session";

export function useUser(userId: string): User | null {
	const { user: self } = useSession();

	const user = useQuery({
		queryKey: userKey(userId),
		queryFn: (context) => self.id === userId
			? self
			: userFetcher(context),
	});

	if (user?.id === self.id) return self;
	return user;
}

export function useRelationship(userId: string): Relationship | null {
	return useQuery({
		queryKey: relationshipKey(userId),
		queryFn: relationshipFetcher,
	});
}

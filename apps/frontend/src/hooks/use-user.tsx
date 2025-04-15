"use client";

import type { WretchOptions } from "wretch";

import type { User } from "~/api/user";
import type { Relationship } from "~/api/user/relationship";
import {
	relationshipFetcher,
	relationshipKey,
	useQuery,
	userFetcher,
	userKey,
} from "~/swr";

import { useSession } from "./use-session";

export function useUser(userId: string): User | null {
	const { user: self } = useSession();

	const { data } = useQuery({
		queryKey: userKey(userId),
		queryFn: userFetcher,
		enabled: self.id !== userId,
	})

	if (self?.id === userId) return self;
	return data;
}

export function useRelationship(userId: string): Relationship | null {
	const { user: self } = useSession();

	const { data = null } = useQuery({
		queryKey: relationshipKey(userId),
		queryFn: relationshipFetcher,
	}
	);

	return data;
}

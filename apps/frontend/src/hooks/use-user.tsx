"use client";

import type { WretchOptions } from "wretch";

import type { User } from "~/api/user";
import type { Relationship } from "~/api/user/relationship";
import {
	relationshipFetcher,
	relationshipKey,
	userFetcher,
	userKey,
	useSWR
} from "~/swr";

import { useSession } from "./use-session";

export function useUser(userId: string, options: WretchOptions = {}): User | null {
	const { user: self } = useSession();

	const { data = null } = useSWR(
		userId
			? self?.id !== userId
				? userKey(userId, options)
				: null
			: null,
		userFetcher,
	);

	// If the user is the current user, return the session user instead.
	if (self?.id === userId) return self;

	return data;
}

export function useRelationship(userId: string): Relationship | null {
	const { user: self } = useSession();

	const { data = null } = useSWR(
		self?.id !== userId
			? relationshipKey(userId)
			: null,
		relationshipFetcher,
	);

	return data;
}

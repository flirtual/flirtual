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

import { useCurrentUser } from "./use-session";

export function useUser(userId: string, options: WretchOptions = {}): User | null {
	const self = useCurrentUser();

	const { data } = useSWR(
		userId
			? self?.id !== userId
				? userKey(userId, options)
				: null
			: null,
		userFetcher,
		{
			suspense: true,
		}
	);

	// If the user is the current user, return the session user instead.
	if (self?.id === userId) return self;

	return data;
}

export function useRelationship(userId: string): Relationship | null {
	const self = useCurrentUser();
	const { data } = useSWR(
		self?.id !== userId
			? relationshipKey(userId)
			: null,
		relationshipFetcher,
		{
			suspense: true
		}
	);

	return data;
}

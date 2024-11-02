"use client";

import useSWR from "swr";

import { User } from "~/api/user";
import type { Relationship } from "~/api/user/relationship";
import { relationshipKey, userFetcher, userKey } from "~/swr";

export function useUser(userId: string): User | null {
	const { data } = useSWR(userKey(userId), userFetcher, {
		suspense: true
	});

	return data;
}

export function useRelationship(userId: string): Relationship | null {
	const { data } = useSWR(relationshipKey(userId), ([, userId]) => User.getRelationship(userId), {
		suspense: true
	});

	return data;
}

export function useUserBySlug(slug: string): User | null {
	const { data } = useSWR(userKey(slug), ([, slug]) => User.getBySlug(slug), {
		suspense: true
	});

	return data;
}

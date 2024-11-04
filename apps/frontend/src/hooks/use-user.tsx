"use client";

import { use } from "react";
import useSWR, { unstable_serialize, useSWRConfig } from "swr";
import type { WretchOptions } from "wretch";

import type { User } from "~/api/user";
import type { Relationship } from "~/api/user/relationship";
import { relationshipFetcher, relationshipKey, userFetcher, userKey } from "~/swr";
import { isUid } from "~/utilities";

import { useCurrentUser } from "./use-session";

export function useUser(_userId: string, options: WretchOptions = {}): User | null {
	const { fallback } = useSWRConfig();
	const self = useCurrentUser();

	// If we've received a slug, we must find the related user from
	// SWR's fallback cache, because we don't have the user's ID yet.
	const userId = _userId
		? isUid(_userId)
			? _userId
			: ((Object.entries(fallback).find(([key, value]) => {
					return value
						&& key.startsWith(unstable_serialize(["user"]))
						&& (value as User).slug.toLowerCase() === _userId.toLowerCase();
				})?.[1]) as User).id
		: null;

	const { data } = useSWR(
		userId
			? self?.id !== userId
				? userKey(userId, options)
				: null
			: null,
		userFetcher,
		{
			suspense: true
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

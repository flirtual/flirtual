"use client";

import useSWR from "swr";

import { User } from "~/api/user";
import { userFetcher, userKey } from "~/swr";

export function useUser(userId: string): User | null {
	const { data } = useSWR(userKey(userId), userFetcher, {
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

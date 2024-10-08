import useSWR from "swr";

import { User } from "~/api/user";

export const userKey = (userId: string) => ["user", userId] as const;
export const userFetcher = ([, userId]: readonly [never, string]) =>
	User.get(userId);

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

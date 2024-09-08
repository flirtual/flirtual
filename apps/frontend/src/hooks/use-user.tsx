import useSWR from "swr";

import { User } from "~/api/user";

export function useUser(userId: string): User | null {
	const { data } = useSWR(["user", userId], ([, userId]) => User.get(userId), {
		suspense: true
	});

	return data;
}

export function useUserBySlug(slug: string): User | null {
	const { data } = useSWR(["user", slug], ([, slug]) => User.getBySlug(slug), {
		suspense: true
	});

	return data;
}

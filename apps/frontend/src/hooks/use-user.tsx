import useSWR from "swr";

import { api } from "~/api";

import type { User } from "~/api/user";

export function useUser(userId: string): User | null {
	const { data } = useSWR(
		`user/${userId}`,
		() => api.user.get(userId).catch(() => null),
		{
			suspense: true
		}
	);

	return data;
}

import useSWR from "swr";

import { User } from "~/api/user";

export function useUser(userId: string): User | null {
	const { data } = useSWR(["user", userId], ([, userId]) => User.get(userId), {
		suspense: true
	});

	return data;
}

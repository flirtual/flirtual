import useSWR from "swr";

import { api } from "~/api";

type UseUserOptions = { userId: string } | { username: string };

export function useUser(options: UseUserOptions) {
	return useSWR(["user", "userId" in options ? options.userId : options.username], () =>
		"userId" in options ? api.user.get(options.userId) : api.user.getByUsername(options.username)
	);
}

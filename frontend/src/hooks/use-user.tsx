import useSWR from "swr";

import { api } from "~/api";

export function useUser(userId: string) {
	return useSWR(`user/${userId}`, () => api.user.get(userId), { suspense: true });
}

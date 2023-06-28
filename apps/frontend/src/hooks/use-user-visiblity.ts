import { useMemo } from "react";
import useSWR from "swr";

import { api } from "~/api";

export function useUserVisibility(userId: string) {
	const key = useMemo(() => ["user", userId, "visible"] as const, [userId]);
	const { data } = useSWR(key, ([, userId]) => api.user.visible(userId), {
		suspense: true
	});

	return data;
}

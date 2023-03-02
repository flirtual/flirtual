import { createContext, useContext } from "react";
import useSWR, { SWRConfiguration, SWRResponse } from "swr";

import { api } from "~/api";
import { User } from "~/api/user/user";

export const UserContext = createContext<User | null>(null);

export type UseCurrentUserOptions = Omit<SWRConfiguration<User | null>, "fetcher" | "fallbackData">;

export function useCurrentUser(
	options: UseCurrentUserOptions = {}
): SWRResponse<User | null, unknown> {
	return useSWR("user", () => api.auth.user().catch(() => null), {
		fallbackData: useContext(UserContext),
		suspense: true,
		...options
	});
}

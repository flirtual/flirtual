import { createContext, useContext } from "react";
import useSWR, { SWRConfiguration } from "swr";

import { api } from "~/api";
import { User } from "~/api/user/user";

export const UserContext = createContext<User | null>(null);

export function useCurrentUser(
	options: Omit<SWRConfiguration<User | null>, "fetcher" | "fallbackData"> = {}
) {
	return useSWR("user", () => api.auth.user().catch(() => null), {
		fallbackData: useContext(UserContext),
		...options
	});
}

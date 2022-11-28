import { createContext, useContext } from "react";
import useSWR from "swr";

import { api } from "~/api";
import { User } from "~/api/user/user";

export const UserContext = createContext<User | null>(null);

export function useCurrentUser() {
	return useSWR("user", api.auth.user, {
		fallbackData: useContext(UserContext)
	});
}

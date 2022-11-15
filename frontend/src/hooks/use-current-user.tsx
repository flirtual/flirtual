import useSWR from "swr";

import { api } from "~/api";

export function useCurrentUser() {
	return useSWR("user", api.auth.user);
}

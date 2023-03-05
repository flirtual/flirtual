import { createContext, useContext } from "react";
import useSWR, { SWRConfiguration } from "swr";

import { api } from "~/api";
import { Session } from "~/api/auth";
import { User } from "~/api/user";

export const SessionContext = createContext<Session | null>(null);

export type UseSessionOptions = Omit<SWRConfiguration<Session | null>, "fetcher" | "fallbackData">;

export function useSession(options: UseSessionOptions = {}) {
	const { data: session = null, mutate } = useSWR(
		"session",
		() => api.auth.session().catch(() => null),
		{
			fallbackData: useContext(SessionContext),
			suspense: true,
			...options
		}
	);

	return [session, mutate] as const;
}

export function useSessionUser(options: UseSessionOptions = {}): User | null {
	const [session] = useSession(options);
	return session?.user ?? null;
}

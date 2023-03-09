import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useSWR, { SWRConfiguration } from "swr";

import { api } from "~/api";
import { Session } from "~/api/auth";
import { User } from "~/api/user";

export type UseSessionOptions = Omit<SWRConfiguration<Session | null>, "fetcher" | "fallbackData">;

export function useSession(options: UseSessionOptions = {}) {
	const router = useRouter();
	const { data: session = null, mutate } = useSWR(
		"session",
		() => api.auth.session().catch(() => null),
		options
	);

	const update = useCallback(
		async (session?: Session | null, refresh: boolean = true) => {
			await mutate(session, { revalidate: false });
			if (refresh) router.refresh();
		},
		[mutate, router]
	);

	return [session, update] as const;
}

export function useSessionUser(options: UseSessionOptions = {}): User | null {
	const [session] = useSession(options);
	return session?.user ?? null;
}

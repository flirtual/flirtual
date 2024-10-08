import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useSWR from "swr";

import { urls } from "~/urls";
import { Authentication, type Session } from "~/api/auth";

import type { User } from "~/api/user";

export function useSession() {
	const router = useRouter();
	const { data: session = null, mutate } = useSWR(
		"session",
		Authentication.getOptionalSession,
		{
			suspense: true
		}
	);

	const update = useCallback(
		async (session?: Session | null, refresh: boolean = true) => {
			await mutate(session || undefined, { revalidate: false });
			if (refresh) router.refresh();
		},
		[mutate, router]
	);

	const logout = useCallback(async () => {
		await Authentication.logout().catch(() => null);
		router.push(urls.login());
		router.refresh();
	}, [router]);

	return [session, update, logout] as const;
}

export function useCurrentUser(): User | null {
	const [session] = useSession();
	return session?.user ?? null;
}

"use client";

import { useEffect } from "react";
import { SWRConfig } from "swr";
import * as Sentry from "@sentry/nextjs";

import { Session } from "~/api/auth";
import { useSession } from "~/hooks/use-session";

export type SessionProviderProps = React.PropsWithChildren<{
	session: Session | null;
}>;

export function SessionProvider({ children, session }: SessionProviderProps) {
	const [, mutateSession] = useSession();

	useEffect(() => {
		void mutateSession(session, false);

		if (!session?.user) return;
		const { id, preferences } = session.user;

		// Set the user context for Sentry depending on the user's privacy settings.
		Sentry.setUser(preferences?.privacy.analytics ? { id } : null);
	}, [session, mutateSession]);

	return (
		<SWRConfig
			value={(swrConfig) => ({
				...swrConfig,
				fallback: {
					...swrConfig?.fallback,
					session
				}
			})}
		>
			{children}
		</SWRConfig>
	);
}

"use client";

import { useEffect } from "react";
import { SWRConfig } from "swr";

import { Session } from "~/api/auth";
import { useSession } from "~/hooks/use-session";

export type SessionProviderProps = React.PropsWithChildren<{
	session: Session | null;
}>;

export function SessionProvider({ children, session }: SessionProviderProps) {
	const [, mutateSession] = useSession();

	useEffect(() => {
		void mutateSession(session, false);
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

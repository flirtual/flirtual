"use client";

import { forwardRef, useEffect } from "react";
import { SWRConfig } from "swr";
import * as Sentry from "@sentry/nextjs";
import { Slot } from "@radix-ui/react-slot";

import { useSession } from "~/hooks/use-session";

import type { Session } from "~/api/auth";

export type SessionProviderProps = React.PropsWithChildren<{
	session: Session | null;
}>;

export const SessionProvider = forwardRef<
	HTMLHtmlElement,
	SessionProviderProps
>(({ children, session, ...props }, ref) => {
	const [, mutateSession] = useSession();

	useEffect(() => {
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
			<Slot
				{...props}
				ref={ref}
				data-user={session?.user?.id ? session.user.id : undefined}
			>
				{children}
			</Slot>
		</SWRConfig>
	);
});

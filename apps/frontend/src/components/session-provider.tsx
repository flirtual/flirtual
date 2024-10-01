"use client";

import { forwardRef } from "react";
import { SWRConfig } from "swr";
import { Slot } from "@radix-ui/react-slot";

import type { Session } from "~/api/auth";

export type SessionProviderProps = React.PropsWithChildren<{
	session: Session | null;
}>;

export const SessionProvider = forwardRef<
	HTMLHtmlElement,
	SessionProviderProps
>(({ children, session, ...props }, reference) => {
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
				data-user={session?.user?.id ? session.user.id : undefined}
				ref={reference}
			>
				{children}
			</Slot>
		</SWRConfig>
	);
});

SessionProvider.displayName = "SessionProvider";

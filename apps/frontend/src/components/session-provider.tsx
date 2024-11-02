"use client";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef, useEffect } from "react";
import { mutate, SWRConfig } from "swr";

import type { Session } from "~/api/auth";
import { sessionKey } from "~/swr";

export type SessionProviderProps = React.PropsWithChildren<{
	session: Session | null;
}>;

export const SessionProvider = forwardRef<
	HTMLHtmlElement,
	SessionProviderProps
>(({ children, session, ...props }, reference) => {
	useEffect(() => void mutate(sessionKey(), session), [session]);

	return (
		<SWRConfig
			value={{
				fallback: {
					session
				}
			}}
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

"use client";

import { Slot } from "@radix-ui/react-slot";
import type { PropsWithChildren, RefAttributes } from "react";
import { useEffect } from "react";
import { mutate, SWRConfig } from "~/swr";

import type { Session } from "~/api/auth";
import { sessionKey } from "~/swr";

export interface SessionProviderProps extends PropsWithChildren, RefAttributes<HTMLHtmlElement> {
	session: Session | null;
}

export function SessionProvider({ children, session, ...props }: SessionProviderProps) {
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

			>
				{children}
			</Slot>
		</SWRConfig>
	);
}

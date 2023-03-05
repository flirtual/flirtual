"use client";

import { SWRConfig } from "swr";

import { Session } from "~/api/auth";

export type SessionProviderClientProps = React.PropsWithChildren<{ session: Session | null }>;

export function SessionProviderClient({ children, session }: SessionProviderClientProps) {
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

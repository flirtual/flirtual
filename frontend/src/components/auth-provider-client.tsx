"use client";

import { SWRConfig } from "swr";

import { User } from "~/api/user";

export type AuthProviderClientProps = React.PropsWithChildren<{ user: User | null }>;

export function AuthProviderClient({ children, user }: AuthProviderClientProps) {
	return (
		<SWRConfig
			value={(swrConfig) => ({
				...swrConfig,
				fallback: {
					...swrConfig?.fallback,
					user: user
				}
			})}
		>
			{children}
		</SWRConfig>
	);
}

"use client";

import { User } from "~/api/user";
import { UserContext } from "~/hooks/use-current-user";

export type SsrUserProviderClientProps = React.PropsWithChildren<{ user: User | null }>;

export function SsrUserProviderClient({ children, user }: SsrUserProviderClientProps) {
	return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

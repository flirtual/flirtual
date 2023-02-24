import { ServerAuthenticateOptions, useServerAuthenticate } from "~/server-utilities";

import { AuthProviderClient } from "./auth-provider-client";

export type AuthProviderProps = React.PropsWithChildren<ServerAuthenticateOptions>;

export async function AuthProvider({ children, ...options }: AuthProviderProps) {
	const user = await useServerAuthenticate(options);

	return <AuthProviderClient user={user}>{children}</AuthProviderClient>;
}

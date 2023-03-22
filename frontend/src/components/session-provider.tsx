import { ServerAuthenticateOptions, useServerAuthenticate } from "~/server-utilities";

import { SessionProviderClient } from "./session-provider-client";

export type SessionProviderProps = React.PropsWithChildren<ServerAuthenticateOptions>;

export async function SessionProvider({ children, ...options }: SessionProviderProps) {
	return (
		<SessionProviderClient session={await useServerAuthenticate(options)}>
			{children}
		</SessionProviderClient>
	);
}

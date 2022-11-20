import { ServerAuthenticateOptions, useServerAuthenticate } from "~/server-utilities";

import { SsrUserProviderClient } from "./ssr-user-provider-client";

export type SsrUserProviderProps = React.PropsWithChildren<ServerAuthenticateOptions>;

export async function SsrUserProvider({ children, ...options }: SsrUserProviderProps) {
	return (
		<SsrUserProviderClient user={await useServerAuthenticate(options)}>
			{children}
		</SsrUserProviderClient>
	);
}

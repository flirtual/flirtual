import { InAppBrowser } from "@capgo/capacitor-inappbrowser";

import { Connection } from "~/api/connections";
import type { ConnectionType } from "~/api/connections";

// Native OAuth connection flow (login/link) via ASWebAuthenticationSession
// (iOS) / Custom Tabs (Android). The provider redirects to an app-scheme deep
// link, which resolves openSecureWindow with the final URL. The redirect URI
// comes from the API (per-environment scheme) and must be registered with the
// provider. Returns the post-grant location, or null if the user cancelled.
export async function authorizeAndGrant(
	type: ConnectionType,
	next: string,
	notifications?: boolean
): Promise<string | null> {
	const { authorizeUrl, redirectUri } = await Connection.authorize({
		type,
		prompt: "consent",
		next,
		notifications
	});

	let redirectedUri: string;

	try {
		({ redirectedUri } = await InAppBrowser.openSecureWindow({
			authEndpoint: authorizeUrl,
			redirectUri
		}));
	}
	catch (reason) {
		console.error("openSecureWindow error:", reason);
		return null;
	}

	const query = Object.fromEntries(new URL(redirectedUri).searchParams.entries());
	if ("error" in query || !query.code) return null;

	const response = await Connection.grant({
		type,
		code: query.code,
		state: query.state,
		redirect: "app"
	});

	return response.headers.get("location");
}

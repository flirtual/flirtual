import { InAppBrowser } from "@capgo/capacitor-inappbrowser";

import { Connection } from "~/api/connections";
import type { ConnectionType } from "~/api/connections";

// We don't show user-cancellation errors.
const cancelErrors = ["access_denied", "user_cancelled_authorize"];

// Native OAuth connection flow (login/link) via ASWebAuthenticationSession
// (iOS) / Custom Tabs (Android). The provider redirects to an app-scheme deep
// link, which resolves openSecureWindow with the final URL. The redirect URI
// comes from the API (per-environment scheme) and must be registered with the
// provider. Returns the post-grant location, null if the user cancelled, or
// throws provider errors.
export async function authorizeAndGrant(
	type: ConnectionType,
	next: string,
	notifications?: boolean,
	signup?: boolean
): Promise<string | null> {
	const { authorizeUrl, redirectUri, state: authorizeState } = await Connection.authorize({
		type,
		prompt: "consent",
		next,
		notifications,
		signup
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

	if (query.error) {
		if (cancelErrors.includes(query.error)) return null;
		throw new Error(query.error);
	}
	if (!query.code) return null;

	const response = await Connection.grant({
		type,
		code: query.code,
		state: authorizeState ?? query.state,
		orgScopedId: query.org_scoped_id,
		redirect: "app"
	});

	return response.headers.get("location");
}

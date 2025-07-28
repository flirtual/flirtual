import { redirect } from "react-router";

import { urls } from "~/urls";

import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
	// Check for session cookie
	const cookies = request.headers.get("cookie");
	if (cookies && cookies.includes("session=")) {
		// Optimistically redirect to the discover page if the session cookie exists.
		// Worst case: If the session is invalid, the user will be redirected to the browse page, then the login page.
		throw redirect(urls.discover("dates"));
	}

	throw redirect(urls.landing);
}

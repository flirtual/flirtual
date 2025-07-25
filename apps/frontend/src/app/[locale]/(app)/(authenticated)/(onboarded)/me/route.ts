import { redirect } from "react-router";

import { Authentication } from "~/api/auth";
import { urls } from "~/urls";

import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
	const session = await Authentication.getOptionalSession();
	if (!session) {
		throw redirect(urls.login(urls.user.me));
	}

	throw redirect(urls.profile(session.user));
}

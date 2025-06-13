// eslint-disable-next-line no-restricted-imports
import { redirect } from "next/navigation";

import { Authentication } from "~/api/auth";
import { urls } from "~/urls";

export const dynamic = "force-dynamic";

export async function GET() {
	const session = await Authentication.getOptionalSession();
	if (!session) return redirect(urls.login(urls.user.me));

	return redirect(urls.profile(session.user));
}

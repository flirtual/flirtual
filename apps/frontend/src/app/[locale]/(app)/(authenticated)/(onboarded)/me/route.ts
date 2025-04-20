// eslint-disable-next-line no-restricted-imports
import { redirect } from "next/navigation";

import { Authentication } from "~/api/auth";
import { urls } from "~/urls";

export const dynamic = "force-dynamic";

export async function GET() {
	const { user } = await Authentication.getSession();
	return redirect(urls.profile(user));
}

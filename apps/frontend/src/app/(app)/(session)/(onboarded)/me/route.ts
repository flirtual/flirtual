import { redirect } from "next/navigation";

import { Authentication } from "~/api/auth";
import { urls } from "~/urls";

export async function GET() {
	const { user } = await Authentication.getSession();
	return redirect(urls.profile(user));
}

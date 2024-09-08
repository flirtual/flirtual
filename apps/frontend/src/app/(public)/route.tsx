import { redirect } from "next/navigation";

import { Authentication } from "~/api/auth";
import { urls } from "~/urls";

export async function GET() {
	const session = await Authentication.getOptionalSession().catch(() => null);

	if (session) redirect(urls.browse());
	redirect(urls.landing);
}

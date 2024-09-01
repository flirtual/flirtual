import { redirect } from "next/navigation";

import { getOptionalSession } from "~/server-utilities";
import { urls } from "~/urls";

export async function GET() {
	const session = await getOptionalSession().catch(() => null);

	if (session) redirect(urls.browse());
	redirect(urls.landing);
}

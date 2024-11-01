import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { Authentication } from "~/api/auth";
import { urls } from "~/urls";

export interface CannyPageProps {
	searchParams?: Promise<{ companyID?: string; redirect?: string }>;
}

export async function GET(request: NextRequest) {
	const { companyID, redirect: to } = Object.fromEntries(request.nextUrl.searchParams.entries());
	if (!to || !to.startsWith("https://") || !companyID) redirect(urls.default);

	const session = await Authentication.getOptionalSession();
	if (!session)
		redirect(urls.login(`/sso/canny?companyID=${companyID}&redirect=${to}`));

	const { token } = await Authentication.sso("canny");
	return redirect(`https://canny.io/api/redirects/sso?companyID=${companyID}&ssoToken=${token}&redirect=${to}`);
}

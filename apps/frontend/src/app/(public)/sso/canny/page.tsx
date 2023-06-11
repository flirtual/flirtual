import { redirect } from "next/navigation";

import { api } from "~/api";
import { thruServerCookies, withOptionalSession } from "~/server-utilities";
import { urls } from "~/urls";

export interface CannyPageProps {
	searchParams?: { companyID?: string; redirect?: string };
}

export default async function CannyPage({ searchParams }: CannyPageProps) {
	const redirectURL = searchParams?.redirect;
	const companyID = searchParams?.companyID;
	if (!redirectURL || !redirectURL.startsWith("https://") || !companyID)
		return null;

	const session = await withOptionalSession();
	if (!session)
		redirect(
			urls.login(`/sso/canny?companyID=${companyID}&redirect=${redirectURL}`)
		);

	const { token } = await api.auth.sso("canny", thruServerCookies());
	redirect(
		`https://canny.io/api/redirects/sso?companyID=${companyID}&ssoToken=${token}&redirect=${redirectURL}`
	);
}

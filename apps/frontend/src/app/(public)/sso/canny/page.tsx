import { redirect } from "next/navigation";

import { Authentication } from "~/api/auth";
import { ExternalRedirect } from "~/components/external-redirect";
import { urls } from "~/urls";

export interface CannyPageProps {
	searchParams?: { companyID?: string; redirect?: string };
}

export default async function CannyPage({ searchParams }: CannyPageProps) {
	const redirectURL = searchParams?.redirect;
	const companyID = searchParams?.companyID;
	if (!redirectURL || !redirectURL.startsWith("https://") || !companyID)
		redirect(urls.default);

	const session = await Authentication.getOptionalSession();
	if (!session)
		redirect(
			urls.login(`/sso/canny?companyID=${companyID}&redirect=${redirectURL}`)
		);

	const { token } = await Authentication.sso("canny");

	return (
		<ExternalRedirect
			url={`https://canny.io/api/redirects/sso?companyID=${companyID}&ssoToken=${token}&redirect=${redirectURL}`}
		/>
	);
}

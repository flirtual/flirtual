import { redirect } from "next/navigation";

import { Authentication } from "~/api/auth";
import { ExternalRedirect } from "~/components/external-redirect";
import { urls } from "~/urls";

export interface CannyPageProps {
	searchParams?: Promise<{ companyID?: string; redirect?: string }>;
}

export default async function CannyPage(props: CannyPageProps) {
	const { companyID, redirect: to } = (await props.searchParams) || {};
	if (!to || !to.startsWith("https://") || !companyID) redirect(urls.default);

	const session = await Authentication.getOptionalSession();
	if (!session)
		redirect(urls.login(`/sso/canny?companyID=${companyID}&redirect=${to}`));

	const { token } = await Authentication.sso("canny");

	return (
		<ExternalRedirect
			url={`https://canny.io/api/redirects/sso?companyID=${companyID}&ssoToken=${token}&redirect=${to}`}
		/>
	);
}

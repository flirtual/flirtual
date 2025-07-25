import { Outlet } from "react-router";

import { useSession } from "~/hooks/use-session";
import { throwRedirect } from "~/redirect";
import { urls } from "~/urls";

export default function OnboardedLayout() {
	const { user } = useSession();

	if (user.status === "registered")
		return throwRedirect(urls.onboarding(1));
	if (user.deactivatedAt)
		return throwRedirect(urls.settings.deactivateAccount);

	return <Outlet />;
}

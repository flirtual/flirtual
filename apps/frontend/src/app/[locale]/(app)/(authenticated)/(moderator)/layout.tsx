import { Outlet } from "react-router";

import { useSession } from "~/hooks/use-session";
import { throwRedirect } from "~/redirect";
import { urls } from "~/urls";

export default function Layout() {
	const { user: { tags } } = useSession();

	if (!tags?.includes("moderator"))
		return throwRedirect(urls.default);

	return <Outlet />;
}

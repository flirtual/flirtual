import { Outlet } from "react-router";

import { ModelCardBack } from "~/components/model-card";
import { useSession } from "~/hooks/use-session";
import { throwRedirect } from "~/redirect";
import { urls } from "~/urls";

export default function Layout() {
	const { user: { tags } } = useSession();

	if (!tags?.includes("admin"))
		return throwRedirect(urls.default);

	return (
		<ModelCardBack>
			<Outlet />
		</ModelCardBack>
	);
}

import { Outlet } from "react-router";

import { useNotificationPrompt } from "~/hooks/use-notifications";

export default function Layout() {
	useNotificationPrompt();

	return <Outlet />;
}

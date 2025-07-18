import { Outlet } from "react-router";

import { useGuest } from "~/hooks/use-session";

export default function MinimalGuestLayout() {
	useGuest();
	return <Outlet />;
}

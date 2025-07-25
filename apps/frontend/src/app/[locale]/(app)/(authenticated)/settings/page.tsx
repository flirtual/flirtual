import { Navigate } from "react-router";

import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { urls } from "~/urls";

export default function SettingsPage() {
	const isDesktop = useScreenBreakpoint("desktop");
	if (isDesktop) return <Navigate replace to={urls.settings.matchmaking()} />;
}

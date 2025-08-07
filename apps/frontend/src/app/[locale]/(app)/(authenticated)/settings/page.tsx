import { Navigate } from "react-router";

import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { urls } from "~/urls";

export async function clientLoader() {
	console.log("Settings page client loader");
}

export default function SettingsPage() {
	return null;

	const isDesktop = useScreenBreakpoint("desktop");
	if (isDesktop) return <Navigate replace to={urls.settings.matchmaking()} />;
}

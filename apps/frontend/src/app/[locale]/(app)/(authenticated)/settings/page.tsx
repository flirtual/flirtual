import { useRevalidator } from "react-router";

import { isDesktop, useBreakpointCallback } from "~/hooks/use-breakpoint";
import { redirect } from "~/i18n";
import { urls } from "~/urls";

export async function clientLoader() {
	if (isDesktop()) return redirect(urls.settings.matchmaking());
}

export default function SettingsPage() {
	const { revalidate } = useRevalidator();
	useBreakpointCallback("desktop", revalidate);

	return null;
}

"use client";

import { redirect } from "next/navigation";

import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { urls } from "~/urls";

export default function SettingsPage() {
	const isDesktop = useScreenBreakpoint("desktop");
	if (isDesktop) redirect(urls.settings.matchmaking());
}

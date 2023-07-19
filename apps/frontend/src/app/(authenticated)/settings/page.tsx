"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { urls } from "~/urls";

export default function SettingsPage() {
	const router = useRouter();

	const isDesktop = useScreenBreakpoint("md");

	useEffect(() => {
		if (isDesktop) router.push(urls.settings.matchmaking());
	}, [isDesktop, router]);

	return null;
}

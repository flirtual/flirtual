"use client";

import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";

import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { MobileBarNavigation } from "~/components/layout/navigation/mobile-bar";
import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";
import { urls } from "~/urls";

import { SettingsNavigation } from "./navigation";

export default function SettingsLayout({ children }: React.ComponentProps<"div">) {
	const segment = useSelectedLayoutSegment();
	const router = useRouter();

	const isDesktop = useScreenBreakpoint("md");

	useEffect(() => {
		if (isDesktop && !segment) router.push(urls.settings.matchmaking());
	}, [isDesktop, segment, router]);

	return (
		<div
			className={twMerge(
				"flex min-h-screen grow flex-col items-center overflow-x-hidden bg-cream font-nunito text-black-80 dark:bg-black-80 dark:text-white-20 sm:flex-col"
			)}
		>
			<Header />
			<div className={twMerge("flex w-full grow", segment ? "flex-col md:flex-row" : "")}>
				<SettingsNavigation navigationInner={segment} />
				{segment && (
					<div className="flex h-full w-full flex-col items-center justify-center sm:py-32 md:px-8">
						{children}
					</div>
				)}
			</div>
			<Footer desktopOnly />
			<MobileBarNavigation />
		</div>
	);
}

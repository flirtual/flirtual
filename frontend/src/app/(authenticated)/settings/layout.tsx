"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { twMerge } from "tailwind-merge";

import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { Navigation } from "~/components/layout/navigation";

import { SettingsNavigation } from "./navigation";

export default function SettingsLayout({ children, ...props }: React.ComponentProps<"div">) {
	const segment = useSelectedLayoutSegment();

	return (
		<div
			{...props}
			className={twMerge(
				"flex min-h-screen grow flex-col items-center overflow-x-hidden bg-cream font-nunito text-black-80 dark:bg-black-80 dark:text-white-20 sm:flex-col",
				props.className
			)}
		>
			<Header />
			<div className={twMerge("flex w-full grow", segment ? "flex-col md:flex-row" : "")}>
				<SettingsNavigation navigationInner={segment} />
				<div
					className={twMerge(
						"h-full w-full flex-col items-center justify-center sm:py-32 md:px-8",
						segment ? "flex" : "hidden md:flex"
					)}
				>
					{children}
				</div>
			</div>
			<Footer desktopOnly />
			<Navigation />
		</div>
	);
}

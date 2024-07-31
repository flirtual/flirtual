import { twMerge } from "tailwind-merge";

import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";

import { SettingsNavigation } from "./navigation";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "Settings",
		template: "%s - Flirtual"
	}
};

export default async function SettingsLayout({
	children
}: React.ComponentProps<"div">) {
	return (
		<div
			className={twMerge(
				"flex min-h-screen grow flex-col items-center bg-white-20 font-nunito text-black-80 vision:bg-transparent dark:bg-black-70 dark:text-white-20 desktop:flex-col desktop:bg-cream"
			)}
		>
			<Header className="hidden desktop:flex" />
			<div className="flex w-full grow flex-col pt-16 desktop:flex-row desktop:justify-center desktop:gap-8 desktop:py-8">
				<SettingsNavigation />
				<div
					className="flex h-full flex-col items-center justify-center"
					vaul-drawer-wrapper=""
				>
					{children}
				</div>
			</div>
			<Footer desktopOnly />
			<Header className="desktop:hidden" />
		</div>
	);
}

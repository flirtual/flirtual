import { twMerge } from "tailwind-merge";
import { Metadata } from "next";

import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { MobileBarNavigation } from "~/components/layout/navigation/mobile-bar";

import { SettingsNavigation } from "./navigation";

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
				"flex min-h-screen grow flex-col items-center overflow-x-hidden bg-cream font-nunito text-black-80 vision:bg-transparent dark:bg-black-80 dark:text-white-20 sm:flex-col"
			)}
		>
			<Header />
			<div className="flex w-full grow flex-col md:flex-row">
				<SettingsNavigation />
				<div className="flex h-full w-full flex-col items-center justify-center pt-[3.75rem] sm:py-16 md:px-8">
					{children}
				</div>
			</div>
			<Footer desktopOnly />
			<MobileBarNavigation />
		</div>
	);
}

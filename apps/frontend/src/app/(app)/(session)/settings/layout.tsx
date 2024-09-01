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
		<div className="flex w-full grow flex-col desktop:flex-row desktop:justify-center desktop:gap-8">
			<SettingsNavigation />
			{children}
		</div>
	);
}

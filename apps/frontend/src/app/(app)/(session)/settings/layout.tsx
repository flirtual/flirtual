import type { Metadata } from "next";

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
		<div className="flex w-full grow flex-col desktop:flex-row desktop:justify-center desktop:gap-8">
			<SettingsNavigation />
			{children}
		</div>
	);
}

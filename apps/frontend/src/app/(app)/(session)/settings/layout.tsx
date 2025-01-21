import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SettingsNavigation } from "./navigation";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: {
			default: t("settings"),
			template: t("page_title")
		}
	};
}

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

import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";

import type { Route } from "./+types/layout";
import { SettingsNavigation } from "./navigation";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title"), name: t("settings") }
	]);
};

export default function SettingsLayout({
	children
}: React.ComponentProps<"div">) {
	return (
		<div className="flex w-full grow flex-col desktop:flex-row desktop:justify-center desktop:gap-8">
			<SettingsNavigation />
			{children}
		</div>
	);
}

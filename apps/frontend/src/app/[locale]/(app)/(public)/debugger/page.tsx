import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";

import type { Route } from "./+types/page";
import { DebugInfo } from "./debug-info";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("debug_information") }
	]);
};

export default function DebuggerPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="h-full desktop:h-fit"
			containerProps={{ className: "gap-4" }}
			title={t("debug_information")}
		>
			<DebugInfo />
		</ModelCard>
	);
}

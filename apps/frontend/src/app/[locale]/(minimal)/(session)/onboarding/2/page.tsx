import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { Onboarding2Form } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("want_to_meet") }) }
	]);
};

export default function Onboarding2Page() {
	const { t } = useTranslation();

	return (
		<ModelCard branded miniFooter className="desktop:max-w-2xl" title={t("want_to_meet")}>
			<Onboarding2Form />
		</ModelCard>
	);
}

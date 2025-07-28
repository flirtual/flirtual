import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { Onboarding1Form } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("about_you") }
	]);
};

export default function Onboarding1Page() {
	const { t } = useTranslation();

	return (
		<ModelCard
			branded
			miniFooter
			className="shrink-0 desktop:max-w-2xl"
			title={t("about_you")}
		>
			<Onboarding1Form />
		</ModelCard>
	);
}

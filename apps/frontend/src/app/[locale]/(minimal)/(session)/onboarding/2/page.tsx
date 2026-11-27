import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { gamesOptions, interestsOptions, platformsOptions } from "~/api/data";
import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { queryClient } from "~/query";

import type { Route } from "./+types/page";
import { Onboarding2Form } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("more_about_you") }) }
	]);
};

export const handle = {
	preload: () => Promise.all([
		queryClient.prefetchQuery(gamesOptions({ locale: i18n.language })),
		queryClient.prefetchQuery(interestsOptions({ locale: i18n.language, order: ["name"] })),
		queryClient.prefetchQuery(platformsOptions({ locale: i18n.language }))
	])
};

export const clientLoader = handle.preload;

export default function Onboarding2Page() {
	const { t } = useTranslation();

	return (
		<ModelCard
			branded
			miniFooter
			className="shrink-0 desktop:max-w-2xl"
			title={t("more_about_you")}
		>
			<Onboarding2Form />
		</ModelCard>
	);
}

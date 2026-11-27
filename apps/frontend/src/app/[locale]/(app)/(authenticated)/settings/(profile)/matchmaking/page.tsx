import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { gendersOptions } from "~/api/data";
import { ModelCard } from "~/components/model-card";
import { advancedFilters } from "~/features";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { queryClient } from "~/query";

import type { Route } from "./+types/page";
import { prefetchAdvancedFilters } from "./advanced-filters";
import { MatchmakingForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("matchmaking") }) }
	]);
};

export const handle = {
	preload: () => Promise.all([
		queryClient.prefetchQuery(gendersOptions({ locale: i18n.language })),
		advancedFilters && prefetchAdvancedFilters(i18n.language)
	])
};

export default function SettingsProfileMatchmakingPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("matchmaking")}
		>
			<MatchmakingForm />
		</ModelCard>
	);
}

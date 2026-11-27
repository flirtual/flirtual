import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { countriesOptions, gamesOptions, gendersOptions, languagesOptions, platformsOptions, sexualitiesOptions } from "~/api/data";
import { ModelCard } from "~/components/model-card";
import { timezones } from "~/features";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { queryClient, timezonesFetcher, timezonesKey } from "~/query";

import type { Route } from "./+types/page";
import { InfoForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("basic_info") }) }
	]);
};

export const handle = {
	async preload() {
		const locale = i18n.language;

		await Promise.all([
			queryClient.prefetchQuery(gamesOptions({ locale })),
			queryClient.prefetchQuery(platformsOptions({ locale })),
			queryClient.prefetchQuery(sexualitiesOptions({ locale })),
			queryClient.prefetchQuery(gendersOptions({ locale })),
			queryClient.prefetchQuery(countriesOptions({ locale })),
			queryClient.prefetchQuery(languagesOptions({ locale, order: ["name"] })),
			...(timezones ? [queryClient.prefetchQuery({ queryKey: timezonesKey(), queryFn: timezonesFetcher })] : [])
		]);
	}
};

export default function SettingsProfileInfoPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("basic_info")}
		>
			<InfoForm />
		</ModelCard>
	);
}

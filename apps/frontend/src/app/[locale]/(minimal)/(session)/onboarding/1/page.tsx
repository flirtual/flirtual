import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { countriesOptions, gendersOptions } from "~/api/data";
import { ModelCard } from "~/components/model-card";
import { timezones } from "~/features";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { queryClient, timezonesFetcher, timezonesKey } from "~/query";

import type { Route } from "./+types/page";
import { Onboarding1Form } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("about_you") }) }
	]);
};

export const handle = {
	preload: () => Promise.all([
		queryClient.prefetchQuery(gendersOptions({ locale: i18n.language })),
		queryClient.prefetchQuery(countriesOptions({ locale: i18n.language })),
		...(timezones ? [queryClient.prefetchQuery({ queryKey: timezonesKey(), queryFn: timezonesFetcher })] : [])
	])
};

export const clientLoader = handle.preload;

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

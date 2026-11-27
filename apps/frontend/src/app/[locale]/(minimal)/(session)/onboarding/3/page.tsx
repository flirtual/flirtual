import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { gendersOptions } from "~/api/data";
import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { queryClient } from "~/query";

import type { Route } from "./+types/page";
import { Onboarding3Form } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("want_to_meet") }) }
	]);
};

export const handle = {
	preload: () => Promise.all([
		queryClient.prefetchQuery(gendersOptions({ locale: i18n.language }))
	])
};

export const clientLoader = handle.preload;

export default function Onboarding3Page() {
	const { t } = useTranslation();

	return (
		<ModelCard branded miniFooter className="desktop:max-w-2xl" title={t("want_to_meet")}>
			<Onboarding3Form />
		</ModelCard>
	);
}

import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { attributeFetcher, attributeKey, queryClient } from "~/query";

import type { Route } from "./+types/page";
import { Onboarding2Form } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("want_to_meet") }) }
	]);
};

export const handle = {
	preload: () => Promise.all(([
		"gender"
	] as const).map((type) => queryClient.prefetchQuery({
		queryKey: attributeKey(type),
		queryFn: attributeFetcher
	})))
};

export const clientLoader = handle.preload;

export default function Onboarding2Page() {
	const { t } = useTranslation();

	return (
		<ModelCard branded miniFooter className="desktop:max-w-2xl" title={t("want_to_meet")}>
			<Onboarding2Form />
		</ModelCard>
	);
}

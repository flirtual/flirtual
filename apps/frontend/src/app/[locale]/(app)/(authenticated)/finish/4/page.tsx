import { useTranslation } from "react-i18next";
import type { MetaFunction } from "react-router";
import invariant from "tiny-invariant";

import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";

import { FinishProgress } from "../progress";
import { finishStepNumber } from "../steps";
import { Finish4Form } from "./form";

// Not Route.MetaFunction: ./+types/page isn't generated while personality is off.
export const meta: MetaFunction = (options) => {
	const { locale } = options.params;
	invariant(locale && isLocale(locale));
	const t = i18n.getFixedT(locale);

	return metaMerge([...rootMeta(options), { title: t("page_title", { name: t("personality") }) }]);
};

export default function Finish4Page() {
	const { t } = useTranslation();

	return (
		<>
			<FinishProgress page={finishStepNumber("personality")} />
			<ModelCard
				className="shrink-0 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title={t("personality")}
			>
				<Finish4Form />
			</ModelCard>
		</>
	);
}

import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";

import { FinishProgress } from "../progress";
import type { Route } from "./+types/page";
import { Finish5Form } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([...rootMeta(options), { title: t("page_title", { name: t("connections") }) }]);
};

export default function Finish5Page() {
	const { t } = useTranslation();

	return (
		<>
			<FinishProgress page={5} />
			<ModelCard
				className="shrink-0 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title={t("connections")}
			>
				<Finish5Form />
			</ModelCard>
		</>
	);
}

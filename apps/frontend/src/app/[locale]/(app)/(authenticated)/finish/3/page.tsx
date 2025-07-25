import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";

import { FinishProgress } from "../progress";
import type { Route } from "./+types/page";
import { Finish3Form } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([...rootMeta(options), { title: t("interests") }]);
};

export default function Finish3Page() {
	const { t } = useTranslation();

	return (
		<>
			<FinishProgress page={3} />
			<ModelCard
				className="shrink-0 pb-[max(calc(var(--safe-area-inset-bottom,0rem)+4.5rem),6rem)] desktop:max-w-2xl desktop:pb-0"
				title={t("interests")}
			>
				<Finish3Form />
			</ModelCard>
		</>
	);
}

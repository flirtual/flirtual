import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";

import { FinishProgress } from "../progress";
import type { Route } from "./+types/page";
import { Finish1Form } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([...rootMeta(options), { title: t("bio_and_pics") }]);
};

export default function Finish1Page() {
	return (
		<>
			<FinishProgress page={1} />
			<ModelCard
				className="shrink-0 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title="Bio & pics"
			>

				<Finish1Form />
			</ModelCard>
		</>
	);
}

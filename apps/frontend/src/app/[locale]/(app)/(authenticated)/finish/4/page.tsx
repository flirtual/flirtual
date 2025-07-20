import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { FinishProgress } from "../progress";
import { Finish4Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("personality")
	};
}

export default function Finish4Page() {
	const { t } = useTranslation();

	return (
		<>
			<FinishProgress page={4} />
			<ModelCard
				className="shrink-0 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title={t("personality")}
			>
				<Finish4Form />
			</ModelCard>
		</>
	);
}

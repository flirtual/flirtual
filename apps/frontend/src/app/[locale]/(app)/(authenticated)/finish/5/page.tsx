import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ModelCard } from "~/components/model-card";

import { FinishProgress } from "../progress";
import { Finish5Form } from "./form";

// export async function generateMetadata(): Promise<Metadata> {
// 	const t = await getTranslations();
//
// 	return {
// 		title: t("connections")
// 	};
// }

export default function Finish5Page({ params }: {
	params: Promise<{ locale: Locale }>;
}) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const t = useTranslations();

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

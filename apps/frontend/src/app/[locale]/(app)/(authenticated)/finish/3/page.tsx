import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ModelCard } from "~/components/model-card";

import { FinishProgress } from "../progress";
import { Finish3Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("interests")
	};
}

export default function Finish3Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const t = useTranslations();

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

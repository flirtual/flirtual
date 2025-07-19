import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import type { Locale } from "~/i18n";

import { Onboarding1Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("about_you")
	};
}

export default function Onboarding1Page({ params }: {
	params: Promise<{ locale: Locale }>;
}) {
	const { locale } = use(params);
	setRequestLocale(locale);

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

import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ModelCard } from "~/components/model-card";

import { Onboarding0Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("create_account")
	};
}

export default function Onboarding0Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const t = useTranslations();

	return (
		<ModelCard
			branded
			miniFooter
			className="shrink-0 desktop:max-w-xl"
			title={t("create_account")}
		>
			<Onboarding0Form />
		</ModelCard>
	);
}

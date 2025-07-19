import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { PrivacyForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("privacy")
	};
}

export default function SettingsAccountPrivacyPage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("privacy")}
		>
			<PrivacyForm />
		</ModelCard>
	);
}

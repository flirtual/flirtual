import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { InfoForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("basic_info")
	};
}

export default function SettingsProfileInfoPage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("basic_info")}
		>
			<InfoForm />
		</ModelCard>
	);
}

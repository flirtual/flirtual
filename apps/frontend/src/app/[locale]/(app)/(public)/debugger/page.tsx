import type { Metadata } from "next";
import type { Locale } from "~/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { DebugInfo } from "./debug-info";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("debug_information")
	};
}

export default function DebuggerPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const { t } = useTranslation();

	return (
		<ModelCard
			className="h-full desktop:h-fit"
			containerProps={{ className: "gap-4" }}
			title={t("debug_information")}
		>
			<DebugInfo />
		</ModelCard>
	);
}

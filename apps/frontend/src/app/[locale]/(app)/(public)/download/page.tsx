import type { Metadata } from "next";
import type { Locale } from "~/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { useTranslation } from "react-i18next";

import { DownloadButton } from "~/components/download-button";
import { ModelCard } from "~/components/model-card";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("download")
	};
}

export default function DownloadPage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	const { t } = useTranslation();

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("download")}>
			<div className="grid grid-cols-1 gap-4 gap-y-2 desktop:grid-cols-2">
				<DownloadButton platform="app_store" />
				<DownloadButton platform="google_play" />
				<DownloadButton platform="microsoft_store" />
				<DownloadButton platform="sidequest" />
			</div>
		</ModelCard>
	);
}

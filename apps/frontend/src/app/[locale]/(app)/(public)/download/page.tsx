import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { DownloadButton } from "~/components/download-button";
import { ModelCard } from "~/components/model-card";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("download")
	};
}

export default function DownloadPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const t = useTranslations();

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

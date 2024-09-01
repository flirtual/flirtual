import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { ModelCard } from "~/components/model-card";
import { DownloadButton } from "~/components/download-button";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("download");

	return {
		title: t("title")
	};
}

export default function DownloadPage() {
	const t = useTranslations("download");

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("title")}>
			<div className="grid grid-cols-1 gap-4 gap-y-2 desktop:grid-cols-2">
				<DownloadButton platform="apple" />
				<DownloadButton platform="google" />
				<DownloadButton platform="microsoft" />
				<DownloadButton platform="side_quest" />
			</div>
		</ModelCard>
	);
}

import { useTranslation } from "react-i18next";

import { DownloadButton } from "~/components/download-button";
import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";

import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("download") }
	]);
};

export default function DownloadPage() {
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

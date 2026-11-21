import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { DownloadButton } from "~/components/download-button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { apk } from "~/features";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("download") }) }
	]);
};

export default function DownloadPage() {
	const { t } = useTranslation();

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("download")}>
			<div className="grid grid-cols-1 items-start gap-4 gap-y-2 desktop:grid-cols-2">
				<DownloadButton platform="app_store" />
				<div className="flex flex-col gap-1">
					<DownloadButton platform="google_play" />
					{apk && (
						<InlineLink
							className="self-center text-sm native:hidden"
							href={urls.apps.apk}
						>
							{t("download_apk")}
						</InlineLink>
					)}
				</div>
				<DownloadButton platform="microsoft_store" />
				<DownloadButton platform="sidequest" />
			</div>
		</ModelCard>
	);
}

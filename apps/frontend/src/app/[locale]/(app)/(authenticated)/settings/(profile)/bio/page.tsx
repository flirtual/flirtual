import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";
import { attributeFetcher, attributeKey, queryClient } from "~/query";

import type { Route } from "./+types/page";
import { BiographyForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("bio_pics") }) }
	]);
};

export async function clientLoader() {
	await queryClient.prefetchQuery({ queryKey: attributeKey("prompt"), queryFn: attributeFetcher });
}

export default function SettingsProfileBiographyPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("bio_pics")}
		>
			<BiographyForm />
		</ModelCard>
	);
}

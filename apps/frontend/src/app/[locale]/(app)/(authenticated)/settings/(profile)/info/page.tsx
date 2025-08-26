import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";
import { attributeFetcher, attributeKey, queryClient } from "~/query";

import type { Route } from "./+types/page";
import { InfoForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("basic_info") }) }
	]);
};

export const handle = {
	async preload() {
		await Promise.all(([
			"game",
			"platform",
			"sexuality",
			"gender",
			"country",
			"language"
		] as const).map((type) => queryClient.prefetchQuery({
			queryKey: attributeKey(type),
			queryFn: attributeFetcher
		})));
	}
};

export default function SettingsProfileInfoPage() {
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

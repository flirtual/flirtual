import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";
import { attributeFetcher, attributeKey, queryClient } from "~/query";

import type { Route } from "./+types/page";
import { InterestsForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("interests") }) }
	]);
};

export const handle = {
	async preload() {
		await Promise.all([
			queryClient.prefetchQuery({ queryKey: attributeKey("interest-category"), queryFn: attributeFetcher }),
			queryClient.prefetchQuery({ queryKey: attributeKey("interest"), queryFn: attributeFetcher })
		]);
	}
};

export default function SettingsProfileInterestsPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("interests")}
		>
			<InterestsForm />
		</ModelCard>
	);
}

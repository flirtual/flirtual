import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { interestCategoriesOptions, interestsOptions } from "~/api/data";
import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { queryClient } from "~/query";

import type { Route } from "./+types/page";
import { InterestsForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("interests") }) }
	]);
};

export const handle = {
	async preload() {
		await Promise.all([
			queryClient.prefetchQuery(interestCategoriesOptions({ locale: i18n.language })),
			queryClient.prefetchQuery(interestsOptions({ locale: i18n.language, order: ["name"] }))
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

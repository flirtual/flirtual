import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { attributeFetcher, attributeKey, queryClient } from "~/query";

import type { Route } from "./+types/page";
import { NsfwForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("nsfw") }) }
	]);
};

export const handle = {
	preload: () => queryClient.prefetchQuery({
		queryKey: attributeKey("kink"),
		queryFn: attributeFetcher
	})
};

export default function SettingsProfileNsfwPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("nsfw")}
		>
			<NsfwForm />
		</ModelCard>
	);
}

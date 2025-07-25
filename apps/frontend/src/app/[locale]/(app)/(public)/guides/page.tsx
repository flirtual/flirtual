import { useTranslation } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";
import { urls } from "~/urls";

import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("guides") }
	]);
};

export default function GuidesPage() {
	const { t } = useTranslation();

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("guides")}>
			<ul className="list-disc text-xl">
				<li>
					<InlineLink href={urls.guides.mentalHealth}>
						{t("mental_health_resources")}
					</InlineLink>
				</li>
			</ul>
		</ModelCard>
	);
}

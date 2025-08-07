import { Trans, useTranslation } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("community_guidelines") }) }
	]);
};

export default function GuidelinesPage() {
	const { t } = useTranslation();

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("community_guidelines")}>
			<div className="flex flex-col gap-8">
				<Trans
					components={{
						p: <p className="select-text" />,
						section: <section className="select-children flex flex-col gap-4" />,
						group: <div className="flex flex-col gap-1" />,
						h1: <h1 className="text-2xl font-semibold" />,
						h2: <h2 className="text-xl font-semibold" />,
						h3: <h3 className="font-semibold" />,
						vulnerability: <InlineLink href={urls.resources.vulnerabilityReport} />,
						email: <InlineLink href={urls.resources.contactDirect} />,
						"mental-health": <InlineLink href={urls.guides.mentalHealth} />,
						terms: <InlineLink href={urls.resources.termsOfService} />,
						privacy: <InlineLink href={urls.resources.privacyPolicy} />
					}}
					i18nKey="seemly_sticky_frightening_fetch"
				/>
			</div>
		</ModelCard>
	);
}

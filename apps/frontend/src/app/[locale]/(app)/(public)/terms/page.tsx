import { Trans, useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { InlineLink } from "~/components/inline-link";
import { MachineTranslatedLegal } from "~/components/machine-translated";
import { ModelCard } from "~/components/model-card";
import { siteOrigin } from "~/const";
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
		{ title: t("page_title", { name: t("terms_of_service") }) }
	]);
};

export default function TermsPage() {
	const { t } = useTranslation();

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("terms_of_service")}>
			<div className="flex flex-col gap-4">
				<MachineTranslatedLegal />
				<Trans
					components={{
						section: <section className="select-children flex flex-col gap-2" />,
						h1: <h1 className="text-2xl font-semibold" />,
						p: <p className="select-text" />,
						ol: <ol className="list-decimal pl-4" />,
						li: <li />,
						privacy: <InlineLink href={urls.resources.privacyPolicy} />,
						guidelines: <InlineLink href={urls.resources.communityGuidelines} />,
						contact: <InlineLink href={urls.resources.contact} />,
						"delete-account": <InlineLink href={urls.settings.deleteAccount} />,
						ssltest: <InlineLink href={`https://www.ssllabs.com/ssltest/analyze.html?d=${siteOrigin}&latest`} />
					}}
					i18nKey="committee_trucks_welcome_approval"
				/>
			</div>
		</ModelCard>
	);
}

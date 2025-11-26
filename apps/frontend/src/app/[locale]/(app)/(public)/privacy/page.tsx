import { Trans, useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { InlineLink } from "~/components/inline-link";
import { MachineTranslatedLegal } from "~/components/machine-translated";
import { ModelCard } from "~/components/model-card";
import { PolicyDates } from "~/components/policy-dates";
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
		{ title: t("page_title", { name: t("privacy_policy") }) }
	]);
};

export default function PrivacyPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="select-children w-full desktop:max-w-2xl"
			containerProps={{ className: "gap-4" }}
			title={t("privacy_policy")}
		>
			<PolicyDates
				introduced={new Date("2025-12-04")}
				otherPolicy="/privacy-20230605"
			/>
			<MachineTranslatedLegal />
			<Trans
				components={{
					h1: <h1 className="text-2xl font-semibold" />,
					p: <p className="select-children" />,
					settings: <InlineLink href={urls.settings.list()} />,
					"settings-privacy": <InlineLink href={urls.settings.privacy} />,
					"settings-delete": <InlineLink href={urls.settings.deleteAccount} />,
					contact: <InlineLink href={urls.resources.privacyEmail} />,
					vulnerability: <InlineLink href={urls.resources.vulnerabilityReport} />,
					"complaint-ca": <InlineLink href="https://www.priv.gc.ca/" />,
					"complaint-eu": <InlineLink href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en" />,
					"complaint-uk": <InlineLink href="https://ico.org.uk/" />,
					"complaint-us-ca": <InlineLink href="https://oag.ca.gov/" />
				}}
				i18nKey="sticks_protect_zinc_explain"
			/>
		</ModelCard>
	);
}

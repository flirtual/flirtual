import { Trans, useTranslation } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { MachineTranslatedLegal } from "~/components/machine-translated";
import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";
import { urls } from "~/urls";

import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("privacy_policy") }
	]);
};

export default function PrivacyPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			containerProps={{ className: "gap-4" }}
			title={t("privacy_policy")}
		>
			<MachineTranslatedLegal />
			<Trans
				components={{
					p: <p className="select-children" />,
					"settings-privacy": <InlineLink href={urls.settings.privacy} />,
					"settings-notifications": <InlineLink href={urls.settings.notifications} />,
					"settings-password": <InlineLink href={urls.settings.password} />,
					settings: <InlineLink href={urls.settings.list()} />,
					vulnerability: <InlineLink href={urls.resources.vulnerabilityReport} />,
					contact: <InlineLink href={urls.resources.contactDirect} />
				}}
				i18nKey="sticks_protect_zinc_explain"
			/>
		</ModelCard>
	);
}

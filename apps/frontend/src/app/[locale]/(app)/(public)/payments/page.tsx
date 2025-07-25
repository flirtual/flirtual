import { Trans, useTranslation } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { MachineTranslatedLegal } from "~/components/machine-translated";
import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";
import { urls } from "~/urls";

import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("payment_terms") }
	]);
};

export default function PaymentsPage() {
	const { t } = useTranslation();

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("payment_terms")}>
			<div className="flex flex-col gap-4">
				<MachineTranslatedLegal />
				<Trans
					components={{
						section: <section className="select-children flex flex-col gap-2" />,
						h1: <h1 className="text-2xl font-semibold" />,
						p: <p className="select-children" />,
						terms: <InlineLink href={urls.resources.termsOfService} />,
						guidelines: <InlineLink href={urls.resources.communityGuidelines} />,
						contact: <InlineLink href={urls.resources.contactDirect} />,
						apple: <InlineLink href="https://getsupport.apple.com/" />,
						google: <InlineLink href="https://support.google.com/googleplay" />
					}}
					i18nKey="trite_alert_ibex_shine"
				/>
			</div>
		</ModelCard>
	);
}

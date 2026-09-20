import { Trans, useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { useOptionalSession } from "~/hooks/use-session";
import { i18n, useLocale } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { throwRedirect } from "~/redirect";
import { urls } from "~/urls";

import type { Route } from "./+types/page";
import { AppealForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("banned_title") }) }
	]);
};

export default function BannedPage() {
	const { t } = useTranslation();
	const [locale] = useLocale();
	const session = useOptionalSession();

	if (!session) throwRedirect(urls.login(urls.banned));

	const { ban } = session.user;

	if (!ban)
		throwRedirect(session.user.status === "registered"
			? urls.onboarding(1)
			: urls.discover("dates"));

	return (
		<ModelCard branded miniFooter title={t("banned_title")}>
			<div className="flex flex-col gap-6">
				<p>
					{new Intl.DateTimeFormat(locale, {
						dateStyle: "medium",
						timeStyle: "short"
					}).format(new Date(ban.at))}
				</p>
				<p>{t("banned_description")}</p>
				{ban.message && (
					<p data-mask className="whitespace-pre-wrap">
						<Trans
							components={{ strong: <strong className="font-bold" /> }}
							i18nKey="banned_reason"
							values={{ message: ban.message }}
						/>
					</p>
				)}
				<p>
					<Trans
						components={{ privacy: <InlineLink href={urls.resources.privacyPolicy} /> }}
						i18nKey="banned_retention"
					/>
				</p>
				<AppealForm appealed={!!ban.appealed} />
			</div>
		</ModelCard>
	);
}

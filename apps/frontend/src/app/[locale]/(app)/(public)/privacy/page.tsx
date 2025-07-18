import type { Metadata } from "next";
import type { Locale } from "~/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { useTranslation } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { MachineTranslatedLegal } from "~/components/machine-translated";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("privacy_policy")
	};
}

export default function PrivacyPage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	const { t } = useTranslation();

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			containerProps={{ className: "gap-4" }}
			title={t("privacy_policy")}
		>
			<MachineTranslatedLegal original={urls.resources.privacyPolicy} />
			{t.rich("sticks_protect_zinc_explain", {
				p: (children) => <p className="select-children">{children}</p>,
				strong: (children) => <strong>{children}</strong>,
				"settings-privacy": (children) => (
					<InlineLink href={urls.settings.privacy}>{children}</InlineLink>
				),
				"settings-notifications": (children) => (
					<InlineLink href={urls.settings.notifications}>{children}</InlineLink>
				),
				"settings-password": (children) => (
					<InlineLink href={urls.settings.password}>{children}</InlineLink>
				),
				settings: (children) => (
					<InlineLink href={urls.settings.list()}>{children}</InlineLink>
				),
				vulnerability: (children) => (
					<InlineLink href={urls.resources.vulnerabilityReport}>
						{children}
					</InlineLink>
				),
				contact: (children) => (
					<InlineLink href={urls.resources.contactDirect}>
						{children}
					</InlineLink>
				)
			})}
		</ModelCard>
	);
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InlineLink } from "~/components/inline-link";
import { MachineTranslatedLegal } from "~/components/machine-translated";
import { ModelCard } from "~/components/model-card";
import { PolicyDates } from "~/components/policy-dates";
import { urls } from "~/urls";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("privacy_policy")
	};
}

export default async function PrivacyPage() {
	const t = await getTranslations();

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
			<MachineTranslatedLegal original={urls.resources.privacyPolicy} />
			{t.rich("sticks_protect_zinc_explain", {
				h1: (children: ReactNode) => (
					<h1 className="text-2xl font-semibold">{children}</h1>
				),
				p: (children: ReactNode) => <p className="select-children">{children}</p>,
				strong: (children: ReactNode) => <strong>{children}</strong>,
				settings: (children) => (
					<InlineLink href={urls.settings.list()}>{children}</InlineLink>
				),
				"settings-privacy": (children) => (
					<InlineLink href={urls.settings.privacy}>{children}</InlineLink>
				),
				"settings-delete": (children) => (
					<InlineLink href={urls.settings.deleteAccount}>{children}</InlineLink>
				),
				contact: (children) => (
					<InlineLink href={urls.resources.privacyEmail}>{children}</InlineLink>
				),
				vulnerability: (children) => (
					<InlineLink href={urls.resources.vulnerabilityReport}>
						{children}
					</InlineLink>
				),
				"complaint-ca": (children) => (
					<InlineLink href="https://www.priv.gc.ca/">{children}</InlineLink>
				),
				"complaint-eu": (children) => (
					<InlineLink href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en">
						{children}
					</InlineLink>
				),
				"complaint-uk": (children) => (
					<InlineLink href="https://ico.org.uk/">{children}</InlineLink>
				),
				"complaint-us-ca": (children) => (
					<InlineLink href="https://oag.ca.gov/">{children}</InlineLink>
				)
			})}
		</ModelCard>
	);
}

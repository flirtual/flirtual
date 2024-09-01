import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { MachineTranslatedLegal } from "~/components/machine-translated";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("privacy");

	return {
		title: t("title")
	};
}

export default async function PrivacyPage() {
	const t = await getTranslations("privacy");

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			containerProps={{ className: "gap-4" }}
			title={t("title")}
		>
			<MachineTranslatedLegal original={urls.resources.privacyPolicy} />
			{t.rich("content", {
				p: (children) => <p>{children}</p>,
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

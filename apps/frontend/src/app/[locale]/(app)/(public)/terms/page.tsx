
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { MachineTranslatedLegal } from "~/components/machine-translated";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("terms_of_service")
	};
}

export default function TermsPage() {
	const { t } = useTranslation();

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("terms_of_service")}>
			<div className="flex flex-col gap-4">
				<MachineTranslatedLegal original={urls.resources.termsOfService} />
				{t.rich("committee_trucks_welcome_approval", {
					section: (children: ReactNode) => (
						<section className="select-children flex flex-col gap-2">
							{children}
						</section>
					),
					h1: (children: ReactNode) => (
						<h1 className="text-2xl font-semibold">{children}</h1>
					),
					p: (children: ReactNode) => <p className="select-text">{children}</p>,
					ol: (children: ReactNode) => (
						<ol className="list-decimal pl-4">{children}</ol>
					),
					li: (children: ReactNode) => <li>{children}</li>,
					privacy: (children) => (
						<InlineLink href={urls.resources.privacyPolicy}>
							{children}
						</InlineLink>
					),
					guidelines: (children) => (
						<InlineLink href={urls.resources.communityGuidelines}>
							{children}
						</InlineLink>
					),
					contact: (children) => (
						<InlineLink href={urls.resources.contact}>{children}</InlineLink>
					),
					"delete-account": (children) => (
						<InlineLink href={urls.settings.deleteAccount}>
							{children}
						</InlineLink>
					),
					ssltest: (children) => (
						<InlineLink href="https://www.ssllabs.com/ssltest/analyze.html?d=flirtu.al&latest">
							{children}
						</InlineLink>
					)
				})}
			</div>
		</ModelCard>
	);
}

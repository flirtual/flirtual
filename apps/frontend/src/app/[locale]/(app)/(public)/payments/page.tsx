import type { Metadata } from "next";
import { type Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { type ReactNode, use } from "react";

import { InlineLink } from "~/components/inline-link";
import { MachineTranslatedLegal } from "~/components/machine-translated";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("payment_terms")
	};
}

export default function PaymentsPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const t = useTranslations();

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("payment_terms")}>
			<div className="flex flex-col gap-4">
				<MachineTranslatedLegal
					original={`${urls.resources.paymentTerms}?language=en`}
				/>
				{t.rich("trite_alert_ibex_shine", {
					section: (children: ReactNode) => (
						<section className="select-children flex flex-col gap-2">
							{children}
						</section>
					),
					h1: (children: ReactNode) => (
						<h1 className="text-2xl font-semibold">{children}</h1>
					),
					p: (children: ReactNode) => <p className="select-children">{children}</p>,
					terms: (children) => (
						<InlineLink href={urls.resources.termsOfService}>
							{children}
						</InlineLink>
					),
					guidelines: (children) => (
						<InlineLink href={urls.resources.communityGuidelines}>
							{children}
						</InlineLink>
					),
					contact: (children) => (
						<InlineLink href={urls.resources.contactDirect}>{children}</InlineLink>
					),
					apple: (children) => (
						<InlineLink href="https://getsupport.apple.com/">{children}</InlineLink>
					),
					google: (children) => (
						<InlineLink href="https://support.google.com/googleplay">{children}</InlineLink>
					)
				})}
			</div>
		</ModelCard>
	);
}

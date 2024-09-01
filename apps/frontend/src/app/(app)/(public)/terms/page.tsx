import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";
import { MachineTranslatedLegal } from "~/components/machine-translated";

import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("terms");

	return {
		title: t("title")
	};
}

export default async function TermsPage() {
	const t = await getTranslations("terms");

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("title")}>
			<div className="flex flex-col gap-4">
				<MachineTranslatedLegal
					original={`${urls.resources.termsOfService}?language=en`}
				/>
				{t.rich("content", {
					section: (children: ReactNode) => (
						<section className="flex flex-col gap-2">{children}</section>
					),
					h1: (children: ReactNode) => (
						<h1 className="text-2xl font-semibold">{children}</h1>
					),
					p: (children: ReactNode) => <p>{children}</p>,
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

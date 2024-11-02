import { kebabCase } from "change-case";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("guidelines");

	return {
		title: t("title")
	};
}

export default async function GuidelinesPage() {
	const t = await getTranslations("guidelines");

	return (
		<ModelCard className="w-full desktop:max-w-2xl" title={t("title")}>
			<div className="flex flex-col gap-8">
				{t.rich("content", {
					p: (children) => <p className="select-text">{children}</p>,
					section: (children) => (
						<section className="select-children flex flex-col gap-4">
							{children}
						</section>
					),
					group: (children) => (
						<div className="flex flex-col gap-1">{children}</div>
					),
					h1: (children) => (
						<h1 className="text-2xl font-semibold" id={children ? kebabCase(children.toString()) : undefined}>
							{children}
						</h1>
					),
					h2: (children) => (
						<h2 className="text-xl font-semibold" id={children ? kebabCase(children.toString()) : undefined}>{children}</h2>
					),
					h3: (children) => <h3 className="font-semibold" id={children ? kebabCase(children.toString()) : undefined}>{children}</h3>,
					vulnerability: (children) => (
						<InlineLink href={urls.resources.vulnerabilityReport}>
							{children}
						</InlineLink>
					),
					email: (children) => (
						<InlineLink href={urls.resources.contactDirect}>
							{children}
						</InlineLink>
					),
					"mental-health": (children) => (
						<InlineLink href={urls.guides.mentalHealth}>{children}</InlineLink>
					),
					terms: (children) => (
						<InlineLink href={urls.resources.termsOfService}>
							{children}
						</InlineLink>
					),
					privacy: (children) => (
						<InlineLink href={urls.resources.privacyPolicy}>
							{children}
						</InlineLink>
					)
				})}
			</div>
		</ModelCard>
	);
}

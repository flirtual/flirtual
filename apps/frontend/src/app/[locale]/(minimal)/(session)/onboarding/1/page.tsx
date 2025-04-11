import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";
import { getCountry } from "~/i18n";

import { Onboarding1Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("about_you")
	};
}

export const dynamic = "force-dynamic";

export default async function Onboarding1Page() {
	const t = await getTranslations();
	const country = await getCountry();

	return (
		<ModelCard
			branded
			miniFooter
			className="shrink-0 desktop:max-w-2xl"
			title={t("about_you")}
		>
			<Onboarding1Form systemCountry={country || undefined} />
		</ModelCard>
	);
}

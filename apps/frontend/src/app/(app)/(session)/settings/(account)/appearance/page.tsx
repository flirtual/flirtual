import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { AppearanceForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("appearance")
	};
}

export default async function SettingsAccountAppearancePage() {
	const t = await getTranslations();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("appearance")}
		>
			<AppearanceForm />
		</ModelCard>
	);
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { PrivacyForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("privacy")
	};
}

export default async function SettingsAccountPrivacyPage() {
	const t = await getTranslations();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("privacy")}
		>
			<PrivacyForm />
		</ModelCard>
	);
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { Onboarding0Form } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("create_account")
	};
}

export default async function Onboarding0Page() {
	const t = await getTranslations();

	return (
		<ModelCard
			branded
			className="shrink-0 desktop:max-w-xl"
			title={t("create_account")}
		>
			<Onboarding0Form />
		</ModelCard>
	);
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { ForgotPasswordForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("forgot");

	return {
		title: t("title")
	};
}

export default async function ForgotPage() {
	const t = await getTranslations("forgot");

	return (
		<ModelCard branded title={t("title")}>
			<ForgotPasswordForm />
		</ModelCard>
	);
}

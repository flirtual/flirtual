import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { ForgotPasswordForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("reset_password")
	};
}

export default async function ForgotPage() {
	const t = await getTranslations();

	return (
		<ModelCard branded miniFooter title={t("reset_password")}>
			<ForgotPasswordForm />
		</ModelCard>
	);
}

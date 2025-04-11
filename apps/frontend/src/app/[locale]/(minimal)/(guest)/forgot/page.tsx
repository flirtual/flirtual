import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ModelCard } from "~/components/model-card";

import { ForgotPasswordForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("reset_password")
	};
}

export default function ForgotPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const t = useTranslations();

	return (
		<ModelCard branded miniFooter title={t("reset_password")}>
			<ForgotPasswordForm />
		</ModelCard>
	);
}

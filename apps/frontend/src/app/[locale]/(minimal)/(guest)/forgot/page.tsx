import type { Metadata } from "next";
import type { Locale } from "~/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { ForgotPasswordForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("reset_password")
	};
}

export default function ForgotPage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	const { t } = useTranslation();

	return (
		<ModelCard branded miniFooter title={t("reset_password")}>
			<ForgotPasswordForm />
		</ModelCard>
	);
}

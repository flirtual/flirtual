import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ConfirmEmailForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("confirm_email")
	};
}

export interface ConfirmEmailPageProps {
	params: Promise<{ locale: Locale }>;
}

export default async function ConfirmEmailPage({ params }: ConfirmEmailPageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	return <ConfirmEmailForm />
}

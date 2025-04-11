import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Authentication } from "~/api/auth";
import { ModelCard } from "~/components/model-card";
import { redirect } from "~/i18n/navigation";
import { urls } from "~/urls";

import { ConfirmTokenForm } from "./confirm-token-form";
import { UserForms } from "./user-forms";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("confirm_email")
	};
}

export interface ConfirmEmailPageProps {
	params: Promise<{ locale: Locale }>;
	searchParams?: Promise<{ to?: string; token?: string }>;
}

export default async function ConfirmEmailPage({ params, searchParams }: ConfirmEmailPageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	const { to, token } = (await searchParams) || {};

	const t = await getTranslations();
	const session = await Authentication.getOptionalSession();

	if (session?.user.emailConfirmedAt && !token) redirect({ href: to ?? urls.browse(), locale });
	if (!session?.user && !token) redirect({ href: urls.login(to), locale });

	if (token) return <ConfirmTokenForm token={token} />;

	return (
		<ModelCard branded title={t("confirm_your_email")}>
			<UserForms />
		</ModelCard>
	);
}

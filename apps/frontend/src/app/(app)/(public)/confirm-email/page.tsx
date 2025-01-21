import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Authentication } from "~/api/auth";
import { ModelCard } from "~/components/model-card";
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
	searchParams?: Promise<{ to?: string; token?: string }>;
}

export default async function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
	const t = await getTranslations();
	const { to, token } = (await searchParams) || {};
	const session = await Authentication.getOptionalSession();

	if (session?.user.emailConfirmedAt && !token) redirect(to ?? urls.browse());
	if (!session?.user && !token) redirect(urls.login(to));

	if (token) return <ConfirmTokenForm token={token} />;

	return (
		<ModelCard branded title={t("confirm_your_email")}>
			<UserForms />
		</ModelCard>
	);
}

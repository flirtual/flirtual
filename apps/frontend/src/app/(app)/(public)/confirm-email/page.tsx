import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Authentication } from "~/api/auth";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import { ConfirmTokenForm } from "./confirm-token-form";
import { UserForms } from "./user-forms";

export const metadata: Metadata = {
	title: "Confirm email"
};

export interface ConfirmEmailPageProps {
	searchParams?: Promise<{ to?: string; token?: string }>;
}

export default async function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
	const { to, token } = (await searchParams) || {};
	const session = await Authentication.getOptionalSession();

	if (session?.user.emailConfirmedAt && !token) redirect(to ?? urls.browse());
	if (!session?.user && !token) redirect(urls.login(to));

	if (token) return <ConfirmTokenForm token={token} />;

	return (
		<ModelCard branded title="Confirm your email">
			<UserForms />
		</ModelCard>
	);
}

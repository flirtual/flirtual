import { redirect } from "next/navigation";

import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";
import { Authentication } from "~/api/auth";

import { UserForms } from "./user-forms";
import { ConfirmTokenForm } from "./confirm-token-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Confirm email"
};

export interface ConfirmEmailPageProps {
	searchParams?: Promise<{ to?: string; token?: string }>;
}

export default async function ConfirmEmailPage(props: ConfirmEmailPageProps) {
	const { to, token } = (await props.searchParams) || {};
	const session = await Authentication.getOptionalSession();

	if (session?.user.emailConfirmedAt && !token) redirect(to ?? urls.browse());

	if (!session?.user && !token) redirect(urls.login(to));

	return (
		<ModelCard branded title="Confirm your email">
			{token ? (
				<ConfirmTokenForm token={token} />
			) : (
				<UserForms user={session?.user} />
			)}
		</ModelCard>
	);
}

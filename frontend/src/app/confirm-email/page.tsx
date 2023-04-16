import { redirect } from "next/navigation";
import { Metadata } from "next";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { useServerAuthenticate } from "~/server-utilities";
import { urls } from "~/urls";

import { ConfirmTokenForm } from "./confirm-token-form";
import { UserForms } from "./user-forms";

export const metadata: Metadata = {
	title: "Confirm email"
};

export interface ConfirmEmailPageProps {
	searchParams?: { to?: string; token?: string };
}

export default async function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
	const session = await useServerAuthenticate({ optional: true, emailConfirmedOptional: true });

	if (session?.user.emailConfirmedAt && !searchParams?.token)
		redirect(searchParams?.to ?? urls.browse());

	if (!session?.user && !searchParams?.token) redirect(urls.login(searchParams?.to));

	return (
		<SoleModelLayout footer={{ desktopOnly: true }}>
			<ModelCard title="Confirm email">
				{searchParams?.token ? (
					<ConfirmTokenForm token={searchParams.token} />
				) : (
					<UserForms user={session?.user} />
				)}
			</ModelCard>
		</SoleModelLayout>
	);
}

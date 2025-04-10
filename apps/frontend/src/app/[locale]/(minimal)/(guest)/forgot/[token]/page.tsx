import { decode } from "jsonwebtoken";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { ResetPasswordForm } from "./form";

export interface ResetPasswordPageProps {
	params: Promise<{ token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("reset_password")
	};
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
	const { token } = await params;

	const payload = decode(token, { json: true });
	if (!payload?.sub) return null;

	const t = await getTranslations();

	return (
		<ModelCard title={t("reset_password")}>
			<ResetPasswordForm email={payload.sub} token={token} />
		</ModelCard>
	);
}

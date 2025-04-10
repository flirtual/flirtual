import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { PasswordChangeForm } from "./change-form";
import { PasswordPasskeyForm } from "./passkey-form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("password_passkeys")
	};
}

export default async function SettingsAccountPasswordPage() {
	const t = await getTranslations();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("password_passkeys")}
		>
			<div className="flex flex-col gap-8">
				<PasswordChangeForm />
				<PasswordPasskeyForm />
			</div>
		</ModelCard>
	);
}

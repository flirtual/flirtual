import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ModelCard } from "~/components/model-card";

import { PasswordChangeForm } from "./change-form";
import { PasswordPasskeyForm } from "./passkey-form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("password_passkeys")
	};
}

export default function SettingsAccountPasswordPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const t = useTranslations();

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

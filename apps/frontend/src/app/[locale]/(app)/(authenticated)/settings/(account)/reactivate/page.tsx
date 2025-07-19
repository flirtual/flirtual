import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ReactivationForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("reactivate_account")
	};
}

export default function SettingsAccountReactivatePage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	return <ReactivationForm />;
}

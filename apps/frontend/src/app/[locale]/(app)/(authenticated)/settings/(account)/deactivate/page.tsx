import type { Metadata } from "next";
import type { Locale } from "~/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { DeactivationForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("deactivate_account")
	};
}

export default function SettingsAccountDeactivatePage() {
	const { locale } = use(params);
	setRequestLocale(locale);

	return <DeactivationForm />;
}

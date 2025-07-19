import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import type { Locale } from "~/i18n";

import { ConnectionsForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("connections")
	};
}

export default function SettingsAccountConnectionsPage({ params }: {
	params: Promise<{ locale: Locale }>;
}) {
	const { locale } = use(params);
	setRequestLocale(locale);

	return <ConnectionsForm />;
}

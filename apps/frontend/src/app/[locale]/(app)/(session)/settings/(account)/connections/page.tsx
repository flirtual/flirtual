import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ConnectionsForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("connections")
	};
}

export const dynamic = "force-dynamic";

export default function SettingsAccountConnectionsPage({ params, searchParams }: {
	params: Promise<{ locale: Locale }>;
	searchParams: Promise<{
		error?: string;
	}>;
}) {
	const { locale } = use(params);
	setRequestLocale(locale);

	const { error } = use(searchParams);
	return <ConnectionsForm error={error} />;
}

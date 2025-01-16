import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ConnectionsForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("connections")
	};
}

export default async function SettingsAccountConnectionsPage({ searchParams }: {
	searchParams?: Promise<{
		error?: string;
	}>;
}) {
	const { error } = (await searchParams) || {};
	return <ConnectionsForm error={error} />;
}

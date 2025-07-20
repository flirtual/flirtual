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
	return <ConnectionsForm />;
}

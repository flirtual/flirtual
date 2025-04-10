import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { NotificationsForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("notifications")
	};
}

export default async function SettingsAccountNotificationsPage() {
	const t = await getTranslations();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("notifications")}
		>
			<NotificationsForm />
		</ModelCard>
	);
}

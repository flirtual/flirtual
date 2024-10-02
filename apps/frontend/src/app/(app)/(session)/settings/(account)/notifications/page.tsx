import { ModelCard } from "~/components/model-card";

import { NotificationsForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Notifications"
};

export default function SettingsAccountNotificationsPage() {
	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Notifications"
		>
			<NotificationsForm />
		</ModelCard>
	);
}

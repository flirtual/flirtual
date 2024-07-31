import { ModelCard } from "~/components/model-card";

import { NotificationsForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Notifications"
};

export default function SettingsAccountNotificationsPage() {
	return (
		<ModelCard
			className="desktop:w-[42rem] desktop:max-w-full"
			title="Notifications"
		>
			<NotificationsForm />
		</ModelCard>
	);
}

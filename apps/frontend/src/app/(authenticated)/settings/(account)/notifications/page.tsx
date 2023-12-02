import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { NotificationsForm } from "./form";

export const metadata: Metadata = {
	title: "Notifications"
};

export default function SettingsAccountNotificationsPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Notifications">
			<NotificationsForm />
		</ModelCard>
	);
}

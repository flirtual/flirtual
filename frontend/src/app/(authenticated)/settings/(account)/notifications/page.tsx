import { ModelCard } from "~/components/model-card";

import { NotificationsForm } from "./form";

export const config = { runtime: "experimental-edge" };

export default function SettingsAccountNotificationsPage() {
	return (
		<ModelCard title="Notifications">
			<NotificationsForm />
		</ModelCard>
	);
}

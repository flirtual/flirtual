import { NotificationsForm } from "./form";

import { ModelCard } from "~/components/model-card";

export default function SettingsAccountNotificationsPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Notifications">
			<NotificationsForm />
		</ModelCard>
	);
}

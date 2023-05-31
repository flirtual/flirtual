import { ModelCard } from "~/components/model-card";

import { NotificationsForm } from "./form";

export default function SettingsAccountNotificationsPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Notifications">
			<NotificationsForm />
		</ModelCard>
	);
}

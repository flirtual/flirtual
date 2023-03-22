import { ModelCard } from "~/components/model-card";

import { ChangeEmailForm } from "./form";

export default function SettingsAccountChangeEmailPage() {
	return (
		<ModelCard title="Change Email">
			<ChangeEmailForm />
		</ModelCard>
	);
}

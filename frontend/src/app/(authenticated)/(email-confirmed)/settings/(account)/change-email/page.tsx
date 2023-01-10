import { ModelCard } from "~/components/model-card";

import { ChangeEmailForm } from "./form";

export const config = { runtime: "experimental-edge" };

export default function SettingsAccountChangeEmailPage() {
	return (
		<ModelCard title="Change Email">
			<ChangeEmailForm />
		</ModelCard>
	);
}

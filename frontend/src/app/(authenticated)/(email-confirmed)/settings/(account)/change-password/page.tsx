import { ModelCard } from "~/components/model-card";

import { ChangePasswordForm } from "./form";

export const config = { runtime: "experimental-edge" };

export default function SettingsAccountChangePasswordPage() {
	return (
		<ModelCard title="Change Password">
			<ChangePasswordForm />
		</ModelCard>
	);
}

import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { ChangePasswordForm } from "./form";

export const metadata: Metadata = {
	title: "Change Password"
};

export default function SettingsAccountChangePasswordPage() {
	return (
		<ModelCard title="Change Password">
			<ChangePasswordForm />
		</ModelCard>
	);
}

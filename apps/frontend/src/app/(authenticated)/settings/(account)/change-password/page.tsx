import { Metadata } from "next";

import { ChangePasswordForm } from "./form";

import { ModelCard } from "~/components/model-card";

export const metadata: Metadata = {
	title: "Change Password"
};

export default function SettingsAccountChangePasswordPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Change Password">
			<ChangePasswordForm />
		</ModelCard>
	);
}

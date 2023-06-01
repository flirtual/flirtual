import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { ChangeEmailForm } from "./form";

export const metadata: Metadata = {
	title: "Change Email"
};

export default function SettingsAccountChangeEmailPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Change Email">
			<ChangeEmailForm />
		</ModelCard>
	);
}

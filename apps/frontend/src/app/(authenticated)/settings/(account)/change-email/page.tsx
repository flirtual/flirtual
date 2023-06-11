import { Metadata } from "next";

import { ChangeEmailForm } from "./form";

import { ModelCard } from "~/components/model-card";

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

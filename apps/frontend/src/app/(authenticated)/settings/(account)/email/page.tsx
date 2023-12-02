import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { EmailForm } from "./form";

export const metadata: Metadata = {
	title: "Email"
};

export default function SettingsAccountEmailPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="Change email">
			<EmailForm />
		</ModelCard>
	);
}

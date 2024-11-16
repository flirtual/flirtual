import type { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { EmailForm } from "./form";

export const metadata: Metadata = {
	title: "Email"
};

export default function SettingsAccountEmailPage() {
	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Change email"
		>
			<EmailForm />
		</ModelCard>
	);
}

import { ModelCard } from "~/components/model-card";

import { EmailForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Email"
};

export default function SettingsAccountEmailPage() {
	return (
		<ModelCard
			className="desktop:w-[42rem] desktop:max-w-full"
			title="Change email"
		>
			<EmailForm />
		</ModelCard>
	);
}

import { ModelCard } from "~/components/model-card";

import { PrivacyForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy"
};

export default function SettingsAccountPrivacyPage() {
	return (
		<ModelCard className="desktop:w-[42rem] desktop:max-w-full" title="Privacy">
			<PrivacyForm />
		</ModelCard>
	);
}

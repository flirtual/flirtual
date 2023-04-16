import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { DeleteForm } from "./form";

export const metadata: Metadata = {
	title: "Delete Account"
};

export default function SettingsAccountDeactivatePage() {
	return (
		<ModelCard title="Delete Account">
			<DeleteForm />
		</ModelCard>
	);
}

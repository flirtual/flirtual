import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { NsfwForm } from "./form";

export const metadata: Metadata = {
	title: "NSFW"
};

export default function SettingsProfileNsfwPage() {
	return (
		<ModelCard className="sm:max-w-2xl" title="NSFW">
			<NsfwForm />
		</ModelCard>
	);
}

import type { Metadata } from "next";

import { Authentication } from "~/api/auth";
import { Personality } from "~/api/user/profile/personality";
import { ModelCard } from "~/components/model-card";

import { PersonalityForm } from "./form";

export const metadata: Metadata = {
	title: "Personality"
};

export default async function SettingsProfilePersonalityPage() {
	const session = await Authentication.getSession();
	const personality = await Personality.get(session.user.id);

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Personality"
		>
			<PersonalityForm personality={personality} />
		</ModelCard>
	);
}

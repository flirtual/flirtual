import { ModelCard } from "~/components/model-card";
import { Authentication } from "~/api/auth";
import { Personality } from "~/api/user/profile/personality";

import { PersonalityForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Personality"
};

export default async function SettingsProfilePersonalityPage() {
	const session = await Authentication.getSession();
	const personality = await Personality.get(session.user.id);

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			title="Personality"
		>
			<PersonalityForm personality={personality} />
		</ModelCard>
	);
}

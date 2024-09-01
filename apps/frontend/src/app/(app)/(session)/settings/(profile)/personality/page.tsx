import { ModelCard } from "~/components/model-card";
import { api } from "~/api";
import { thruServerCookies, getSession } from "~/server-utilities";

import { PersonalityForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Personality"
};

export default async function SettingsProfilePersonalityPage() {
	const session = await getSession();
	const personality = await api.user.profile.getPersonality(
		session.user.id,
		thruServerCookies()
	);

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			title="Personality"
		>
			<PersonalityForm personality={personality} />
		</ModelCard>
	);
}

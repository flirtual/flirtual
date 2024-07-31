import { ModelCard } from "~/components/model-card";
import { api } from "~/api";
import { thruServerCookies, withSession } from "~/server-utilities";

import { PersonalityForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Personality"
};

export default async function SettingsProfilePersonalityPage() {
	const session = await withSession();
	const personality = await api.user.profile.getPersonality(
		session.user.id,
		thruServerCookies()
	);

	return (
		<ModelCard
			className="desktop:w-[42rem] desktop:max-w-full"
			title="Personality"
		>
			<PersonalityForm personality={personality} />
		</ModelCard>
	);
}

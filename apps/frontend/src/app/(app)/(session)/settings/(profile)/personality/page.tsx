import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Authentication } from "~/api/auth";
import { Personality } from "~/api/user/profile/personality";
import { ModelCard } from "~/components/model-card";

import { PersonalityForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("personality")
	};
}

export default async function SettingsProfilePersonalityPage() {
	const t = await getTranslations();
	const session = await Authentication.getSession();
	const personality = await Personality.get(session.user.id);

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("personality")}
		>
			<PersonalityForm personality={personality} />
		</ModelCard>
	);
}

import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { PersonalityForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("personality")
	};
}

export default function SettingsProfilePersonalityPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("personality")}
		>
			<PersonalityForm />
		</ModelCard>
	);
}

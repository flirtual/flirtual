import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { NsfwForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("nsfw")
	};
}

export default function SettingsProfileNsfwPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("nsfw")}
		>
			<NsfwForm />
		</ModelCard>
	);
}

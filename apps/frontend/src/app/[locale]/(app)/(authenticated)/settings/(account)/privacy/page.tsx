
import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { PrivacyForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("privacy")
	};
}

export default function SettingsAccountPrivacyPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("privacy")}
		>
			<PrivacyForm />
		</ModelCard>
	);
}

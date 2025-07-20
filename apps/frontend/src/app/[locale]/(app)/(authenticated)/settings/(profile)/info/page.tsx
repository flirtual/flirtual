import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { InfoForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("basic_info")
	};
}

export default function SettingsProfileInfoPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("basic_info")}
		>
			<InfoForm />
		</ModelCard>
	);
}

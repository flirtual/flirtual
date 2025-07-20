import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { DeleteForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("delete_account")
	};
}

export default function SettingsAccountDeactivatePage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("delete_account")}
		>
			<DeleteForm />
		</ModelCard>
	);
}

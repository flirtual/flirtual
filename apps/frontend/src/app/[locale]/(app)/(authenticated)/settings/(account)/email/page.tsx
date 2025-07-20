
import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { EmailForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("email")
	};
}

export default function SettingsAccountEmailPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("change_email")}
		>
			<EmailForm />
		</ModelCard>
	);
}

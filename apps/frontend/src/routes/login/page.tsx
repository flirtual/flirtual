import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { LoginForm } from "./form";

// export async function generateMetadata(): Promise<Metadata> {
// 	const t = await getTranslations();
//
// 	return {
// 		title: t("login")
// 	};
// }

export default function LoginPage() {
	const { t } = useTranslation();

	return (
		<ModelCard branded miniFooter className="shrink-0 desktop:max-w-xl" title={t("log_in")}>
			<LoginForm />
		</ModelCard>
	);
}

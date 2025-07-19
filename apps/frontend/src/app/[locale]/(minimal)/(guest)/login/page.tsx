import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";

import { LoginForm } from "./form";

export default function LoginPage() {
	const { t } = useTranslation();

	return (
		<>
			<title>{t("page_title", { name: t("login") })}</title>
			<ModelCard branded miniFooter className="shrink-0 desktop:max-w-xl" title={t("log_in")}>
				<LoginForm />
			</ModelCard>
		</>
	);
}

import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/root";

import type { Route } from "./+types/page";
import { ForgotPasswordForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("reset_password") }) },
	]);
};

export default function ForgotPage() {
	const { t } = useTranslation();

	return (
		<ModelCard branded miniFooter title={t("reset_password")}>
			<ForgotPasswordForm />
		</ModelCard>
	);
}

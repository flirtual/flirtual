import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { ForgotPasswordForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("reset_password") }) },
	]);
};

export default function ForgotPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			branded
			brandedLink
			miniFooter
			title={t("reset_password")}
		>
			<ForgotPasswordForm />
		</ModelCard>
	);
}

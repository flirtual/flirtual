import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { LoginForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("create_account") }) },
	]);
};

export default function LoginPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			branded
			miniFooter
			className="shrink-0 desktop:max-w-xl"
			title={t("log_in")}
		>
			<LoginForm />
		</ModelCard>
	);
}

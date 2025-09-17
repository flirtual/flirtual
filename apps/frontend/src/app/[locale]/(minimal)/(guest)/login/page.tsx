import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { LoginForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("login") }) },
	]);
};

export default function LoginPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			branded
			brandedLink
			miniFooter
			className="shrink-0 desktop:max-w-xl"
			title={t("log_in")}
		>
			<LoginForm />
		</ModelCard>
	);
}

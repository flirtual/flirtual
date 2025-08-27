import invariant from "tiny-invariant";

import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { ConfirmEmailForm } from "./form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("confirm_email") }) }
	]);
};

export default function ConfirmEmailPage() {
	return <ConfirmEmailForm />;
}

import { useTranslation } from "react-i18next";

import { ModelCard } from "~/components/model-card";
import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { PasswordChangeForm } from "./change-form";
import { PasswordPasskeyForm } from "./passkey-form";

export const meta: Route.MetaFunction = (options) => {
	const t = i18n.getFixedT(options.params.locale ?? defaultLocale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("password_passkeys") }
	]);
};

export default function SettingsAccountPasswordPage() {
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("password_passkeys")}
		>
			<div className="flex flex-col gap-8">
				<PasswordChangeForm />
				<PasswordPasskeyForm />
			</div>
		</ModelCard>
	);
}

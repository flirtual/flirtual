import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import type { Config } from "~/api/config";
import { useEmailLogin } from "~/app/[locale]/(minimal)/(guest)/login/last-connection";
import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { configKey, queryClient } from "~/query";

import type { Route } from "./+types/page";
import { PasswordChangeForm } from "./change-form";
import { PasswordPasskeyForm } from "./passkey-form";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);
	const emailLogin = queryClient.getQueryData<Config>(configKey())?.loginProviders.includes("email") ?? true;

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t(emailLogin ? "password_passkeys" : "passkeys") }) }
	]);
};

export default function SettingsAccountPasswordPage() {
	const { t } = useTranslation();
	const emailLogin = useEmailLogin();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t(emailLogin ? "password_passkeys" : "passkeys")}
		>
			<div className="flex flex-col gap-8">
				{emailLogin && <PasswordChangeForm />}
				<PasswordPasskeyForm heading={emailLogin} />
			</div>
		</ModelCard>
	);
}

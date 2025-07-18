import { useLocale } from "~/i18n";
import type { FC } from "react";

import { ModelCard } from "~/components/model-card";
import { useOptionalSession } from "~/hooks/use-session";
import { redirect, useSearchParams } from "~/i18n/navigation";
import { urls } from "~/urls";

import { ConfirmTokenForm } from "./confirm-token-form";
import { UserForms } from "./user-forms";

export const ConfirmEmailForm: FC = () => {
	const [searchParameters] = useSearchParams();

	const to = searchParameters.get("to") || undefined;
	const token = searchParameters.get("");

	const [locale] = useLocale();
	const { t } = useTranslation();

	const session = useOptionalSession();

	if (session?.user.emailConfirmedAt && !token) redirect({ href: to ?? urls.discover("dates"), locale });
	if (!session?.user && !token) redirect({ href: urls.login(to), locale });

	if (token) return <ConfirmTokenForm token={token} />;

	return (
		<ModelCard branded title={t("confirm_your_email")}>
			<UserForms />
		</ModelCard>
	);
};

import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { ModelCard } from "~/components/model-card";
import { useOptionalSession } from "~/hooks/use-session";
import { throwRedirect } from "~/redirect";
import { urls } from "~/urls";

import { ConfirmTokenForm } from "./confirm-token-form";
import { UserForms } from "./user-forms";

export const ConfirmEmailForm: FC = () => {
	const [searchParameters] = useSearchParams();

	const to = searchParameters.get("to") || undefined;
	const token = searchParameters.get("");

	const { t } = useTranslation();

	const session = useOptionalSession({ placeholderData: undefined });

	if (session?.user.emailConfirmedAt && !token) throwRedirect(to ?? urls.discover("dates"));
	if (!session?.user && !token) throwRedirect(urls.login(urls.confirmEmail({ to })));

	if (token) return <ConfirmTokenForm token={token} />;

	return (
		<ModelCard branded title={t("confirm_your_email")}>
			<UserForms />
		</ModelCard>
	);
};

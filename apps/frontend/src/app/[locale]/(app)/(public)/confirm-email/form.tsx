"use client"

import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";
import { useOptionalSession } from "~/hooks/use-session";
import { redirect, useSearchParams } from "~/i18n/navigation";
import { urls } from "~/urls";
import { ConfirmTokenForm } from "./confirm-token-form";
import { ModelCard } from "~/components/model-card";
import { UserForms } from "./user-forms";

export const ConfirmEmailForm: FC = () => {
  const searchParams = useSearchParams();

  const to = searchParams.get("to")  || undefined;
  const token = searchParams.get("");

  const locale = useLocale();
	const t = useTranslations();

  const session = useOptionalSession();

	if (session?.user.emailConfirmedAt && !token) redirect({ href: to ?? urls.discover("dates"), locale });
	if (!session?.user && !token) redirect({ href: urls.login(to), locale });

	if (token) return <ConfirmTokenForm token={token} />;

	return (
		<ModelCard branded title={t("confirm_your_email")}>
			<UserForms />
		</ModelCard>
	);
}

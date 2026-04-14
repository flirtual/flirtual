import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { Session } from "~/api/auth";
import { ButtonLink } from "~/components/button";
import { sessionKey, useQueryState } from "~/query";
import { urls } from "~/urls";

import { SignUpButton } from "./sign-up-button";

export const CallToActionGuest: FC<{ className?: string }> = ({ className }) => {
	const { t } = useTranslation();

	return (
		<div className={twMerge("grid grid-cols-2 gap-2", className)}>
			<SignUpButton tabIndex={1} />
			<ButtonLink href={urls.login()} kind="secondary" tabIndex={2}>
				{t("log_in")}
			</ButtonLink>
		</div>
	);
};

export const CallToAction: FC<{ className?: string }> = ({ className }) => {
	const { t } = useTranslation();
	const { data: session } = useQueryState<Session | null>(sessionKey());

	if (session) return (
		<div className={twMerge("gap-2", className)}>
			<ButtonLink href={urls.discover("dates")}>
				{t("start_matching")}
			</ButtonLink>
		</div>
	);

	return <CallToActionGuest className={className} />;
};
